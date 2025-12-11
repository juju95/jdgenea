<?php

namespace App\Service\GedcomImport;

class GedcomDateParser
{
    private const DATE_PATTERNS = [
        '/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i' => 'd M Y',
        '/^(\d{4})-(\d{2})-(\d{2})$/' => 'Y-m-d',
        '/^(ABT|EST|CAL)\s+(\d{4})$/i' => 'approx_year',
        '/^(FROM)\s+(.+)\s+(TO)\s+(.+)$/i' => 'period',
    ];
    
    private const MONTHS = [
        'JAN'=>1,'FEB'=>2,'MAR'=>3,'APR'=>4,'MAY'=>5,'JUN'=>6,
        'JUL'=>7,'AUG'=>8,'SEP'=>9,'OCT'=>10,'NOV'=>11,'DEC'=>12,
        // French support just in case
        'JANV'=>1,'FEVR'=>2,'MARS'=>3,'AVR'=>4,'MAI'=>5,'JUIN'=>6,
        'JUIL'=>7,'AOUT'=>8,'SEPT'=>9,'OCT'=>10,'NOV'=>11,'DEC'=>12,
    ];

    public function parse(string $dateString): ?\DateTimeImmutable
    {
        $dateString = trim($dateString);
        if (empty($dateString)) {
            return null;
        }

        // 1. Try DD MMM YYYY (e.g. 11 JUN 2025)
        if (preg_match('/^(\d{1,2})\s+([A-Z]{3,4})\s+(\d{4})$/i', $dateString, $matches)) {
            $day = (int)$matches[1];
            $monthStr = strtoupper($matches[2]);
            $year = (int)$matches[3];
            $month = self::MONTHS[$monthStr] ?? 1;
            
            return (new \DateTimeImmutable())->setDate($year, $month, $day)->setTime(0, 0, 0);
        }

        // 2. Try YYYY-MM-DD
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $dateString, $matches)) {
            return (new \DateTimeImmutable($dateString))->setTime(0, 0, 0);
        }
        
        // 3. Try just YYYY
        if (preg_match('/^(\d{4})$/', $dateString, $matches)) {
             return (new \DateTimeImmutable())->setDate((int)$matches[1], 1, 1)->setTime(0, 0, 0);
        }
        
        // 4. Try MMM YYYY
        if (preg_match('/^([A-Z]{3,4})\s+(\d{4})$/i', $dateString, $matches)) {
            $monthStr = strtoupper($matches[1]);
            $year = (int)$matches[2];
            $month = self::MONTHS[$monthStr] ?? 1;
            return (new \DateTimeImmutable())->setDate($year, $month, 1)->setTime(0, 0, 0);
        }

        // 5. Try approximate dates (ABT 1990) - treat as exact for now or 1st Jan
        if (preg_match('/^(?:ABT|EST|CAL)\s+(.*)$/i', $dateString, $matches)) {
             return $this->parse($matches[1]);
        }

        return null;
    }

    public function parseTime(string $timeString): ?\DateTimeImmutable
    {
        $timeString = trim($timeString);
        if (empty($timeString)) {
            return null;
        }
        
        try {
            return new \DateTimeImmutable($timeString);
        } catch (\Exception $e) {
            return null;
        }
    }
}
