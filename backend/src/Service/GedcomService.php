<?php

namespace App\Service;

use App\Entity\Person;
use App\Entity\Family;
use Doctrine\ORM\EntityManagerInterface;

class GedcomService
{
    public function __construct(private readonly EntityManagerInterface $em) {}

    public function import(string $filePath, string $treeId): array
    {
        if (!is_file($filePath)) {
            return ['status' => 'error', 'errors' => ['Fichier introuvable']];
        }
        $content = file_get_contents($filePath);
        if ($content === false) {
            return ['status' => 'error', 'errors' => ['Lecture impossible']];
        }

        $indiBlocks = [];
        $famBlocks = [];
        $lines = preg_split('/\r?\n/', $content);
        $current = null; $buffer = [];
        foreach ($lines as $line) {
            if (preg_match('/^0\s+@([^@]+)@\s+INDI/', $line, $m)) {
                if ($current) { $indiBlocks[$current] = $buffer; $buffer = []; }
                $current = $m[1];
            } elseif (preg_match('/^0\s+@([^@]+)@\s+FAM/', $line, $m)) {
                if ($current && $buffer) { $indiBlocks[$current] = $buffer; $buffer = []; }
                $current = 'FAM:'.$m[1];
            }
            $buffer[] = $line;
        }
        if ($current && str_starts_with($current,'FAM:')) { $famBlocks[substr($current,4)] = $buffer; }
        elseif ($current) { $indiBlocks[$current] = $buffer; }

        $mapIndiToPersonId = [];
        $personsImported = 0; $familiesImported = 0; $errors = [];

        // Pass 1: persons
        foreach ($indiBlocks as $indiId => $block) {
            $firstName = null; $lastName = null; $gender = null;
            $birthDate = null; $birthPlace = null; $deathDate = null; $deathPlace = null;
            foreach ($block as $l) {
                if (preg_match('/^1\s+NAME\s+(.*)$/', $l, $m)) {
                    $name = trim($m[1]);
                    if (preg_match('/^(.*?)\s*\/(.*?)\//', $name, $nm)) { $firstName = trim($nm[1]); $lastName = trim($nm[2]); }
                    else { $firstName = $name; }
                }
                if (preg_match('/^1\s+SEX\s+(M|F)/', $l, $m)) { $gender = $m[1]; }
                if (preg_match('/^1\s+BIRT$/', $l)) { $ctx = 'BIRT'; }
                if (preg_match('/^2\s+DATE\s+(.*)$/', $l, $m) && ($ctx ?? null) === 'BIRT') { $birthDate = trim($m[1]); }
                if (preg_match('/^2\s+PLAC\s+(.*)$/', $l, $m) && ($ctx ?? null) === 'BIRT') { $birthPlace = trim($m[1]); }
                if (preg_match('/^1\s+DEAT$/', $l)) { $ctx = 'DEAT'; }
                if (preg_match('/^2\s+DATE\s+(.*)$/', $l, $m) && ($ctx ?? null) === 'DEAT') { $deathDate = trim($m[1]); }
                if (preg_match('/^2\s+PLAC\s+(.*)$/', $l, $m) && ($ctx ?? null) === 'DEAT') { $deathPlace = trim($m[1]); }
            }
            $pid = self::uuid();
            $p = new Person($pid, $treeId, $firstName ?? 'Inconnu', $lastName ?? '');
            // garder l'id GEDCOM d'origine (numérique si présent)
            $numeric = preg_replace('/\D+/', '', (string)$indiId);
            if ($numeric !== '') $p->setGedcomId($numeric);
            if ($gender) $p->setGender($gender);
            if ($birthPlace) $p->setBirthPlace($birthPlace);
            if ($deathPlace) $p->setDeathPlace($deathPlace);
            try { if ($birthDate) $p->setBirthDate(new \DateTimeImmutable(self::toIso($birthDate))); } catch(\Throwable) {}
            try { if ($deathDate) $p->setDeathDate(new \DateTimeImmutable(self::toIso($deathDate))); } catch(\Throwable) {}
            $this->em->persist($p);
            $mapIndiToPersonId[$indiId] = $pid; $personsImported++;
        }
        $this->em->flush();

        // Définir la personne centrale si GEDCOM id 1 existe
        $tree = $this->em->getRepository(\App\Entity\Tree::class)->find($treeId);
        if ($tree && isset($mapIndiToPersonId['1'])) { $tree->setRootPersonId($mapIndiToPersonId['1']); $this->em->flush(); }

        // Pass 2: families
        foreach ($lines as $line) {
            if (preg_match('/^0\s+@([^@]+)@\s+FAM/', $line, $m)) {
                $famId = $m[1]; $husb = null; $wife = null; $children = [];
                $bufferFam = [];
                $bufferFam[] = $line; $i = array_search($line, $lines, true);
                // read subsequent lines until next 0-level or end (approximate)
            }
        }
        // Simple second pass using regex across content
        if (preg_match_all('/0\s+@([^@]+)@\s+FAM([\s\S]*?)(?=\n0\s+@|\Z)/', $content, $ms, PREG_SET_ORDER)) {
            foreach ($ms as $m) {
                $husb = null; $wife = null; $children = [];
                if (preg_match('/1\s+HUSB\s+@([^@]+)@/', $m[2], $mm)) { $husb = $mm[1]; }
                if (preg_match('/1\s+WIFE\s+@([^@]+)@/', $m[2], $mm)) { $wife = $mm[1]; }
                if (preg_match_all('/1\s+CHIL\s+@([^@]+)@/', $m[2], $mc)) { $children = $mc[1]; }
                $treeFam = new Family();
                // assign ids
                $rf = new \ReflectionClass($treeFam); $rpId = $rf->getProperty('id'); $rpId->setAccessible(true); $rpId->setValue($treeFam, self::uuid());
                $rpTree = $rf->getProperty('treeId'); $rpTree->setAccessible(true); $rpTree->setValue($treeFam, $treeId);
                if ($husb && isset($mapIndiToPersonId[$husb])) { $rf->getProperty('husbandId')->setAccessible(true); $rf->getProperty('husbandId')->setValue($treeFam, $mapIndiToPersonId[$husb]); }
                if ($wife && isset($mapIndiToPersonId[$wife])) { $rf->getProperty('wifeId')->setAccessible(true); $rf->getProperty('wifeId')->setValue($treeFam, $mapIndiToPersonId[$wife]); }
                $this->em->persist($treeFam); $familiesImported++;
                $this->em->flush();
                foreach ($children as $childIndi) {
                    if (!isset($mapIndiToPersonId[$childIndi])) continue;
                    $child = $this->em->getRepository(Person::class)->find($mapIndiToPersonId[$childIndi]);
                    if ($child) {
                        if ($husb && isset($mapIndiToPersonId[$husb])) $child->setFatherId($mapIndiToPersonId[$husb]);
                        if ($wife && isset($mapIndiToPersonId[$wife])) $child->setMotherId($mapIndiToPersonId[$wife]);
                    }
                }
            }
            $this->em->flush();
        }

        return [
            'status' => 'done',
            'personsImported' => $personsImported,
            'familiesImported' => $familiesImported,
            'errors' => $errors,
        ];
    }

    public function export(string $treeId): string
    {
        return "0 HEAD\n1 SOUR JdGenea\n1 GEDC\n2 VERS 5.5.1\n0 TRLR\n";
    }

    private static function uuid(): string
    { $d=random_bytes(16); $d[6]=chr(ord($d[6])&0x0f|0x40); $d[8]=chr(ord($d[8])&0x3f|0x80); $h=bin2hex($d); return sprintf('%s-%s-%s-%s-%s',substr($h,0,8),substr($h,8,4),substr($h,12,4),substr($h,16,4),substr($h,20)); }

    private static function toIso(string $gedDate): string
    {
        // naive parse: accept formats like DD MMM YYYY -> YYYY-MM-DD
        $months = [
            'JAN'=>1,'FEB'=>2,'MAR'=>3,'APR'=>4,'MAY'=>5,'JUN'=>6,'JUL'=>7,'AUG'=>8,'SEP'=>9,'OCT'=>10,'NOV'=>11,'DEC'=>12,
        ];
        if (preg_match('/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i', trim($gedDate), $m)) {
            $month = $months[strtoupper($m[2])] ?? 1; return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$month, (int)$m[1]);
        }
        if (preg_match('/^(\d{4})-\d{2}-\d{2}$/', trim($gedDate))) return trim($gedDate);
        // fallback to current date
        return date('Y-m-d');
    }
}
