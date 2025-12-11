<?php

namespace App\Service;

use App\Repository\PersonRepository;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;

class SosaCalculatorService
{
    public function __construct(
        private EntityManagerInterface $em,
        private PersonRepository $personRepository,
        private TreeRepository $treeRepository
    ) {}

    public function calculate(string $treeId): void
    {
        // 1. Get Tree Root
        $tree = $this->treeRepository->find($treeId);
        if (!$tree || !$tree->getRootPersonId()) {
            return;
        }
        $rootId = $tree->getRootPersonId();

        // 2. Load all persons (id, fatherId, motherId) to minimize DB calls
        // We use a raw query or DQL to get only necessary fields
        $rawPersons = $this->personRepository->createQueryBuilder('p')
            ->select('p.id, p.fatherId, p.motherId')
            ->where('p.treeId = :treeId')
            ->setParameter('treeId', $treeId)
            ->getQuery()
            ->getArrayResult();

        $personMap = [];
        foreach ($rawPersons as $p) {
            $personMap[$p['id']] = [
                'f' => $p['fatherId'] ?? null,
                'm' => $p['motherId'] ?? null
            ];
        }

        // 3. Clear existing Sosa
        $this->em->createQuery('UPDATE App\Entity\Person p SET p.sosa = NULL WHERE p.treeId = :treeId')
            ->setParameter('treeId', $treeId)
            ->execute();

        // 4. Traverse
        $updates = []; // id => sosa_value
        $queue = [];
        
        // Push root
        if (isset($personMap[$rootId])) {
            $queue[] = ['id' => $rootId, 'sosa' => '1'];
        }

        while (!empty($queue)) {
            $current = array_shift($queue);
            $cid = $current['id'];
            $csosa = $current['sosa'];

            $updates[$cid] = $csosa;

            $node = $personMap[$cid];
            
            // Father: sosa * 2
            if ($node['f'] && isset($personMap[$node['f']])) {
                // Use BC Math or GMP for large numbers if needed, but for now standard string math logic or simple multiplication if fits in int
                // PHP handles large int automatically? Up to 2^63.
                // 2^63 is enough for 63 generations.
                // If sosa is a string, we might need to be careful.
                // Let's rely on PHP's dynamic typing.
                
                $fSosa = bcmul($csosa, '2');
                $queue[] = ['id' => $node['f'], 'sosa' => $fSosa];
            }

            // Mother: sosa * 2 + 1
            if ($node['m'] && isset($personMap[$node['m']])) {
                $mSosa = bcadd(bcmul($csosa, '2'), '1');
                $queue[] = ['id' => $node['m'], 'sosa' => $mSosa];
            }
        }

        // 5. Batch Update
        // Doing one by one is slow.
        // We can group updates?
        // Or just iterate and flush every X.
        // Using raw SQL is fastest for updates.
        
        $batchSize = 100;
        $i = 0;
        
        $conn = $this->em->getConnection();
        $conn->beginTransaction();
        
        try {
            foreach ($updates as $pid => $sosaVal) {
                $conn->executeStatement(
                    'UPDATE persons SET sosa = :sosa WHERE id = :id',
                    ['sosa' => $sosaVal, 'id' => $pid]
                );
                
                $i++;
                if ($i % $batchSize === 0) {
                    // Commit and restart transaction to avoid long lock? 
                    // No, usually commit at the end.
                }
            }
            $conn->commit();
        } catch (\Exception $e) {
            $conn->rollBack();
            throw $e;
        }
    }
}
