<?php

namespace App\Service\GedcomImport;

use App\Entity\Person;
use App\Entity\PersonMedia;
use App\Entity\PersonSource;
use App\Repository\PersonRepository;
use Doctrine\ORM\EntityManagerInterface;

class PersonImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private PersonRepository $personRepository,
        private GedcomDateParser $dateParser
    ) {}

    public function import(array $personsData, string $treeId, array $sourceMap, array $mediaMap): array
    {
        $importedPersons = [];
        $batchSize = 50;
        $i = 0;

        foreach ($personsData as $gedcomId => $data) {
            $numericId = preg_replace('/\D+/', '', $gedcomId);
            
            $person = $this->personRepository->findOneBy(['gedcomId' => $numericId, 'treeId' => $treeId]);
            
            if (!$person) {
                $person = new Person($this->uuid(), $treeId, 'Unknown', 'Unknown');
                $person->setGedcomId($numericId);
            }

            // Name
            $this->parseName($person, $data['children']);
            
            // Sex
            $sex = $this->findTagValue($data['children'], 'SEX');
            if ($sex) $person->setGender($sex);

            // Events
            $this->parseEvent($person, $data['children'], 'BIRT', 'birth');
            $this->parseEvent($person, $data['children'], 'DEAT', 'death');

            // Occupation
            $occu = $this->findTagValue($data['children'], 'OCCU');
            if ($occu) $person->setOccupation($occu);

            // Notes
            $note = $this->findTagValue($data['children'], 'NOTE');
            if ($note) $person->setNotes($note);

            // Creation/Change times
            $this->parseChangeTime($person, $data['children']);

            $this->em->persist($person);
            $importedPersons[$gedcomId] = $person;

            // Handle Media Links (OBJE)
            $this->parseMediaLinks($person, $data['children'], $mediaMap);
            
            // Handle Sources (SOUR)
            $this->parseSourceLinks($person, $data['children'], $sourceMap);

            if (($i++ % $batchSize) === 0) {
                $this->em->flush();
            }
        }
        $this->em->flush();

        return $importedPersons;
    }

    private function parseName(Person $person, array $children): void
    {
        $nameTag = $this->findTag($children, 'NAME');
        if ($nameTag) {
            $rawName = $nameTag['value'];
            $firstName = '';
            $lastName = '';

            if (preg_match('/^(.*?)\s*\/(.*?)\//', $rawName, $matches)) {
                $firstName = trim($matches[1]);
                $lastName = trim($matches[2]);
            } else {
                $firstName = trim($rawName);
            }
            
            $givn = $this->findTagValue($nameTag['children'], 'GIVN');
            if ($givn) $firstName = $givn;
            
            $surn = $this->findTagValue($nameTag['children'], 'SURN');
            if ($surn) $lastName = $surn;

            // Handle multiple first names
            $parts = explode(' ', $firstName);
            if (count($parts) > 1) {
                $person->setFirstName($parts[0]);
                $person->setMiddleName(implode(' ', array_slice($parts, 1)));
            } else {
                $person->setFirstName($firstName);
                $person->setMiddleName('');
            }
            
            $person->setLastName($lastName);
        }
    }

    private function parseEvent(Person $person, array $children, string $tag, string $type): void
    {
        $eventNode = $this->findTag($children, $tag);
        if (!$eventNode) return;

        $dateStr = $this->findTagValue($eventNode['children'], 'DATE');
        $timeStr = $this->findTagValue($eventNode['children'], 'TIME');
        $placeStr = $this->findTagValue($eventNode['children'], 'PLAC');
        
        $date = null;
        if ($dateStr) {
            $date = $this->dateParser->parse($dateStr);
        }
        
        $time = null;
        if ($timeStr) {
            $time = $this->dateParser->parseTime($timeStr);
        }

        // Map coordinates
        $map = $this->findTag($eventNode['children'], 'MAP');
        if ($map) {
            $lati = $this->findTagValue($map['children'], 'LATI');
            $long = $this->findTagValue($map['children'], 'LONG');
            
            if ($lati && $long) {
                $lati = str_replace(['N', 'S', 'E', 'W'], ['', '-', '', '-'], $lati);
                $latVal = $this->parseCoord($lati);
                $longVal = $this->parseCoord($long);
                
                if ($type === 'birth') {
                    $person->setBirthLatitude($latVal);
                    $person->setBirthLongitude($longVal);
                } elseif ($type === 'death') {
                    $person->setDeathLatitude($latVal);
                    $person->setDeathLongitude($longVal);
                }
            }
        }
        
        if ($type === 'birth') {
             if ($placeStr) $person->setBirthPlace($placeStr);
             if ($date) $person->setBirthDate($date);
             if ($time) $person->setBirthTime($time);
        } elseif ($type === 'death') {
             if ($placeStr) $person->setDeathPlace($placeStr);
             if ($date) $person->setDeathDate($date);
             if ($time) $person->setDeathTime($time);
        }
    }

    private function parseChangeTime(Person $person, array $children): void
    {
        $crea = $this->findTag($children, '_CREA');
        if ($crea) {
            $date = $this->findTagValue($crea['children'], 'DATE');
            $time = $this->findTagValue($crea['children'], 'TIME');
            if ($date) {
                 $dt = $this->dateParser->parse($date);
                 if ($dt && $time) {
                     $t = $this->dateParser->parseTime($time);
                     if ($t) $dt = $dt->setTime((int)$t->format('H'), (int)$t->format('i'), (int)$t->format('s'));
                 }
                 if ($dt) $person->setCreatedTime($dt);
            }
        }
        
        $chan = $this->findTag($children, 'CHAN');
        if ($chan) {
             $date = $this->findTagValue($chan['children'], 'DATE');
             $time = $this->findTagValue($chan['children'], 'TIME');
             if ($date) {
                 $dt = $this->dateParser->parse($date);
                 if ($dt && $time) {
                     $t = $this->dateParser->parseTime($time);
                     if ($t) $dt = $dt->setTime((int)$t->format('H'), (int)$t->format('i'), (int)$t->format('s'));
                 }
                 if ($dt) $person->setChangedTime($dt);
            }
        }
    }

    private function parseMediaLinks(Person $person, array $children, array $mediaMap): void
    {
        // Find all OBJE tags
        foreach ($children as $child) {
            if ($child['tag'] === 'OBJE') {
                $mediaRef = $child['value']; // @O1@
                if ($mediaRef && isset($mediaMap[$mediaRef])) {
                    $media = $mediaMap[$mediaRef];
                    // Check if already linked to avoid duplicates
                    // For simplicity, we assume we might need to clear old links if re-importing, 
                    // but here we just add. Doctrine unique constraint on PersonMedia might fail if duplicates.
                    // Ideally we should check existence.
                    
                    // But PersonMedia is a join entity, explicit check needed.
                    // For now, let's just persist, assuming clean slate or unique constraint handles it (or fails).
                    // To be safe, we could check DB.
                    
                    // Actually, let's check local unique array if we process multiple times? No.
                    
                    // Check existence in DB?
                    // $exists = $this->em->getRepository(PersonMedia::class)->findOneBy(['person' => $person, 'media' => $media]);
                    // if (!$exists) ...
                    
                    // Or catch exception?
                    
                    // Let's create it.
                    // Note: If re-running import, we might get duplicate key error.
                    // The command test will likely fail on second run if we don't clear or check.
                    // But for "Import" feature, usually we want to merge or update.
                    
                    // Let's check simply using DQL or just assume new tree for now as per user flow.
                    // The user said "revoir l'import", usually implies re-importing.
                    // I will check if exists.
                    
                    $exists = $this->em->getRepository(PersonMedia::class)->findOneBy(['personId' => $person->getId(), 'mediaId' => $media->getId()]);
                    if (!$exists) {
                        $pm = new PersonMedia($person, $media);
                        $this->em->persist($pm);
                    }
                }
            }
        }
    }

    private function parseSourceLinks(Person $person, array $children, array $sourceMap): void
    {
        foreach ($children as $child) {
            if ($child['tag'] === 'SOUR') {
                $sourceRef = $child['value']; // @S1@
                if ($sourceRef && isset($sourceMap[$sourceRef])) {
                    $source = $sourceMap[$sourceRef];
                    $exists = $this->em->getRepository(PersonSource::class)->findOneBy(['personId' => $person->getId(), 'sourceId' => $source->getId()]);
                    if (!$exists) {
                        $ps = new PersonSource($person, $source);
                        $this->em->persist($ps);
                    }
                }
            }
        }
    }
    
    private function parseCoord(string $coord): ?string
    {
        $coord = trim($coord);
        if (empty($coord)) return null;
        
        $factor = 1;
        if (str_starts_with($coord, 'S') || str_starts_with($coord, 'W')) {
            $factor = -1;
        }
        $val = preg_replace('/[^0-9.]/', '', $coord);
        if (is_numeric($val)) {
            return (string)((float)$val * $factor);
        }
        return null;
    }

    private function findTag(array $children, string $tag): ?array
    {
        foreach ($children as $child) {
            if ($child['tag'] === $tag) return $child;
        }
        return null;
    }

    private function findTagValue(array $children, string $tag): ?string
    {
        $node = $this->findTag($children, $tag);
        if ($node) {
             $value = $node['value'];
             if (!empty($node['children'])) {
                foreach ($node['children'] as $sub) {
                    if ($sub['tag'] === 'CONC') $value .= $sub['value'];
                    if ($sub['tag'] === 'CONT') $value .= "\n" . $sub['value'];
                }
            }
            return $value;
        }
        return null;
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
        $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
        $h = bin2hex($d);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }
}
