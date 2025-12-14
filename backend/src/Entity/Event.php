<?php

namespace App\Entity;

use App\Repository\EventRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EventRepository::class)]
#[ORM\Table(name: 'events')]
class Event
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 36)]
    private string $personId;

    #[ORM\Column(type: 'string', length: 40)]
    private string $type; // e.g. BIRTH, BAPTISM, MARRIAGE, DEATH, OTHER

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $dateOriginal = null;

    #[ORM\Column(type: 'string', length: 10, nullable: true)]
    private ?string $time = null; // HH:mm

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $place = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $placeSubdivision = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isPrivate = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct(string $id, string $personId, string $type)
    {
        $this->id = $id; $this->personId = $personId; $this->type = $type;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getPersonId(): string { return $this->personId; }
    public function getType(): string { return $this->type; }
    public function getDate(): ?\DateTimeInterface { return $this->date; }
    public function setDate(?\DateTimeInterface $d): void { $this->date = $d; }
    public function getDateOriginal(): ?string { return $this->dateOriginal; }
    public function setDateOriginal(?string $d): void { $this->dateOriginal = $d; }
    public function getTime(): ?string { return $this->time; }
    public function setTime(?string $t): void { $this->time = $t; }
    public function getPlace(): ?string { return $this->place; }
    public function setPlace(?string $p): void { $this->place = $p; }
    public function getPlaceSubdivision(): ?string { return $this->placeSubdivision; }
    public function setPlaceSubdivision(?string $p): void { $this->placeSubdivision = $p; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $d): void { $this->description = $d; }
    public function isPrivate(): bool { return $this->isPrivate; }
    public function setIsPrivate(bool $v): void { $this->isPrivate = $v; }
}

