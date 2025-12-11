<?php

namespace App\Service\GedcomImport;

use App\Entity\Family;
use App\Entity\Person;
use App\Repository\FamilyRepository;
use Doctrine\ORM\EntityManagerInterface;

class FamilyImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private FamilyRepository $familyRepository,
        private GedcomDateParser $dateParser
    ) {}

    public function import(array $familiesData, string $treeId, array $personMap): array
    {
        $importedFamilies = [];
        $batchSize = 50;
        $i = 0;

        foreach ($familiesData as $gedcomId => $data) {
            $fam = new Family();
            // We can't set ID manually on Family via constructor, need to check if we can set it via reflection or setter
            // Family.php has setId setter.
            $fam->setId($this->uuid());
            $fam->setTreeId($treeId);

            // Husband
            $husbRef = $this->findTagValue($data['children'], 'HUSB');
            if ($husbRef) {
                $husbId = preg_replace('/\D+/', '', $husbRef);
                // In personMap, keys are original GEDCOM IDs (e.g. @I1@ or just I1 or 1)
                // My parser returns @I1@ as ID usually. 
                // Wait, PersonImportService used `preg_replace('/\D+/', '', $gedcomId)` as key?
                // No, `$importedPersons[$gedcomId] = $person;` where `$gedcomId` comes from `$personsData` keys.
                // GedcomParserService uses `@I1@` as keys in `$data['INDI']`.
                // So I should look up `@I1@` directly or handle the `@` mismatch.
                
                // Let's assume the map uses the raw keys from parser (@I1@).
                if (isset($personMap[$husbRef])) {
                    $fam->setHusbandId($personMap[$husbRef]->getId());
                }
            }

            // Wife
            $wifeRef = $this->findTagValue($data['children'], 'WIFE');
            if ($wifeRef) {
                 if (isset($personMap[$wifeRef])) {
                    $fam->setWifeId($personMap[$wifeRef]->getId());
                }
            }

            // Children
            $childrenRefs = $this->findAllTagValues($data['children'], 'CHIL');
            foreach ($childrenRefs as $childRef) {
                if (isset($personMap[$childRef])) {
                    $child = $personMap[$childRef];
                    if ($fam->getHusbandId()) $child->setFatherId($fam->getHusbandId());
                    if ($fam->getWifeId()) $child->setMotherId($fam->getWifeId());
                    // Note: We are modifying Person here, ensure it's managed or re-fetched if detached
                    // Since we just imported them in same request, they should be managed.
                }
            }

            // Marriage Event
            $marr = $this->findTag($data['children'], 'MARR');
            if ($marr) {
                $dateStr = $this->findTagValue($marr['children'], 'DATE');
                $placeStr = $this->findTagValue($marr['children'], 'PLAC');
                $timeStr = $this->findTagValue($marr['children'], 'TIME');

                if ($dateStr) {
                    $date = $this->dateParser->parse($dateStr);
                    if ($date) $fam->setMarriageDate($date);
                }
                
                if ($placeStr) {
                    $fam->setMarriagePlace($placeStr);
                }

                if ($timeStr) {
                    $time = $this->dateParser->parseTime($timeStr);
                    if ($time) $fam->setMarriageTime($time);
                }

                // Coordinates
                $map = $this->findTag($marr['children'], 'MAP');
                if ($map) {
                    $lati = $this->findTagValue($map['children'], 'LATI');
                    $long = $this->findTagValue($map['children'], 'LONG');
                    if ($lati && $long) {
                         $lati = str_replace(['N', 'S', 'E', 'W'], ['', '-', '', '-'], $lati);
                         $fam->setMarriageLatitude($this->parseCoord($lati));
                         $fam->setMarriageLongitude($this->parseCoord($long));
                    }
                }
            }

            $this->em->persist($fam);
            $importedFamilies[$gedcomId] = $fam;

            if (($i++ % $batchSize) === 0) {
                $this->em->flush();
            }
        }
        $this->em->flush();

        return $importedFamilies;
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

    private function findAllTagValues(array $children, string $tag): array
    {
        $values = [];
        foreach ($children as $child) {
            if ($child['tag'] === $tag) {
                $values[] = $child['value'];
            }
        }
        return $values;
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

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
        $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
        $h = bin2hex($d);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }
}
