<?php

namespace App\Repository;

use App\Entity\Person;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PersonRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Person::class);
    }

    public function findMaxGedcomIdNumber(string $treeId): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.gedcomId')
            ->where('p.treeId = :treeId')
            ->andWhere("p.gedcomId LIKE 'I%'")
            ->setParameter('treeId', $treeId);
            
        $results = $qb->getQuery()->getScalarResult();
        
        $max = 0;
        foreach ($results as $row) {
            $id = $row['gedcomId'];
            $numStr = substr($id, 1);
            if (is_numeric($numStr)) {
                $val = (int)$numStr;
                if ($val > $max) {
                    $max = $val;
                }
            }
        }
        
        return $max;
    }
}

