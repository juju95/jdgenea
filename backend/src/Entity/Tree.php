<?php

namespace App\Entity;

use App\Repository\TreeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TreeRepository::class)]
#[ORM\Table(name: 'trees')]
class Tree
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 36)]
    private string $userId;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $rootPersonId = null;

    #[ORM\Column(type: 'integer', options: ['default' => 100])]
    private int $livingThreshold = 100;

    public function __construct(string $id, string $userId, string $name)
    {
        $this->id = $id;
        $this->userId = $userId;
        $this->name = $name;
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setDescription(?string $description): void { $this->description = $description; }
    public function getDescription(): ?string { return $this->description; }
    public function getRootPersonId(): ?string { return $this->rootPersonId; }
    public function setRootPersonId(?string $v): void { $this->rootPersonId = $v; }
    public function getLivingThreshold(): int { return $this->livingThreshold; }
    public function setLivingThreshold(int $v): void { $this->livingThreshold = $v; }
}
