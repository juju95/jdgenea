<?php

namespace App\Service\GedcomImport;

class GedcomParserService
{
    public function parse(string $content): array
    {
        $lines = $this->tokenize($content);
        return $this->buildStructure($lines);
    }

    private function tokenize(string $content): array
    {
        $lines = [];
        $rawLines = preg_split('/\r?\n/', $content);
        foreach ($rawLines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            
            // Format: LEVEL [TAG|ID] [LINE_VALUE]
            // Example 1: 0 @I1@ INDI
            // Example 2: 1 NAME John /Doe/
            // Example 3: 1 BIRT
            
            if (preg_match('/^(\d+)\s+(@[^@]+@)\s+(.+)$/', $line, $matches)) {
                // Level ID TAG
                $lines[] = [
                    'level' => (int)$matches[1],
                    'id' => $matches[2],
                    'tag' => $matches[3],
                    'value' => null
                ];
            } elseif (preg_match('/^(\d+)\s+([A-Za-z0-9_]+)(?:\s+(.+))?$/', $line, $matches)) {
                // Level TAG [VALUE]
                $lines[] = [
                    'level' => (int)$matches[1],
                    'tag' => $matches[2],
                    'value' => $matches[3] ?? null,
                    'id' => null
                ];
            }
        }
        return $lines;
    }

    private function buildStructure(array $lines): array
    {
        $data = [
            'HEAD' => null,
            'INDI' => [],
            'FAM' => [],
            'OBJE' => [],
            'SOUR' => [],
            'NOTE' => [],
            'REPO' => [],
            'SUBM' => [],
            'TRLR' => null
        ];

        $stack = []; // Stores references to current node at each level
        
        foreach ($lines as $line) {
            $level = $line['level'];
            $node = [
                'tag' => $line['tag'],
                'value' => $line['value'],
                'id' => $line['id'],
                'children' => []
            ];

            if ($level === 0) {
                // Root element
                $stack = [$level => &$node];
                
                // Store based on tag
                if ($line['id']) {
                    // It's an entity (INDI, FAM, OBJE, SOUR, NOTE, REPO, SUBM)
                    $tag = $line['tag'];
                    if (isset($data[$tag])) {
                        $data[$tag][$line['id']] = &$node;
                    } else {
                        // Unknown root tag with ID
                        $data[$tag][$line['id']] = &$node;
                    }
                } else {
                    // It's a structure (HEAD, TRLR)
                    $data[$line['tag']] = &$node;
                }
                unset($node); // Break reference
            } else {
                // Child element
                $parentLevel = $level - 1;
                if (isset($stack[$parentLevel])) {
                    $stack[$parentLevel]['children'][] = &$node;
                    $stack[$level] = &$node;
                    unset($node);
                }
            }
        }

        return $data;
    }
}
