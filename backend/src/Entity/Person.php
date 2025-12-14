<?php

namespace App\Entity;

use App\Repository\PersonRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PersonRepository::class)]
#[ORM\Table(name: 'persons')]
class Person
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 36)]
    private string $treeId;

    #[ORM\Column(type: 'string', length: 100)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $middleName = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $maidenName = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeInterface $birthDate = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $birthDateOriginal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $birthPlace = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeInterface $baptismDate = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $baptismDateOriginal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $baptismPlace = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeInterface $deathDate = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $deathDateOriginal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $deathPlace = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeInterface $birthTime = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeInterface $baptismTime = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeInterface $deathTime = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $createdTime = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $changedTime = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8, nullable: true)]
    private ?string $birthLatitude = null;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8, nullable: true)]
    private ?string $birthLongitude = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8, nullable: true)]
    private ?string $baptismLatitude = null;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8, nullable: true)]
    private ?string $baptismLongitude = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8, nullable: true)]
    private ?string $deathLatitude = null;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8, nullable: true)]
    private ?string $deathLongitude = null;

    #[ORM\Column(type: 'string', length: 1, nullable: true)]
    private ?string $gender = null;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $fatherId = null;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $motherId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $occupation = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isLiving = true;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $biography = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $posX = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $posY = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomId = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $sosa = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    public function __construct(string $id, string $treeId, string $firstName, string $lastName)
    {
        $this->id = $id;
        $this->treeId = $treeId;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): string { return $this->id; }
    public function getTreeId(): string { return $this->treeId; }
    public function getFirstName(): string { return $this->firstName; }
    public function setFirstName(string $v): void { $this->firstName = $v; }
    public function getLastName(): string { return $this->lastName; }
    public function setLastName(string $v): void { $this->lastName = $v; }
    public function getMiddleName(): ?string { return $this->middleName; }
    public function setMiddleName(?string $v): void { $this->middleName = $v; }
    public function getMaidenName(): ?string { return $this->maidenName; }
    public function setMaidenName(?string $v): void { $this->maidenName = $v; }
    public function getGender(): ?string { return $this->gender; }
    public function setGender(?string $v): void { $this->gender = $v; }
    public function getFatherId(): ?string { return $this->fatherId; }
    public function setFatherId(?string $v): void { $this->fatherId = $v; }
    public function getMotherId(): ?string { return $this->motherId; }
    public function setMotherId(?string $v): void { $this->motherId = $v; }
    public function getBirthPlace(): ?string { return $this->birthPlace; }
    public function setBirthPlace(?string $v): void { $this->birthPlace = $v; }
    public function getBirthDate(): ?\DateTimeInterface { return $this->birthDate; }
    public function setBirthDate(?\DateTimeInterface $v): void { $this->birthDate = $v; }
    public function getBaptismDate(): ?\DateTimeInterface { return $this->baptismDate; }
    public function setBaptismDate(?\DateTimeInterface $v): void { $this->baptismDate = $v; }
    public function getBaptismPlace(): ?string { return $this->baptismPlace; }
    public function setBaptismPlace(?string $v): void { $this->baptismPlace = $v; }
    public function getDeathPlace(): ?string { return $this->deathPlace; }
    public function setDeathPlace(?string $v): void { $this->deathPlace = $v; }
    public function getDeathDate(): ?\DateTimeInterface { return $this->deathDate; }
    public function setDeathDate(?\DateTimeInterface $v): void { $this->deathDate = $v; }
    public function getBirthTime(): ?\DateTimeInterface { return $this->birthTime; }
    public function setBirthTime(?\DateTimeInterface $v): void { $this->birthTime = $v; }
    public function getBaptismTime(): ?\DateTimeInterface { return $this->baptismTime; }
    public function setBaptismTime(?\DateTimeInterface $v): void { $this->baptismTime = $v; }
    public function getDeathTime(): ?\DateTimeInterface { return $this->deathTime; }
    public function setDeathTime(?\DateTimeInterface $v): void { $this->deathTime = $v; }
    public function getCreatedTime(): ?\DateTimeInterface { return $this->createdTime; }
    public function setCreatedTime(?\DateTimeInterface $v): void { $this->createdTime = $v; }
    public function getChangedTime(): ?\DateTimeInterface { return $this->changedTime; }
    public function setChangedTime(?\DateTimeInterface $v): void { $this->changedTime = $v; }
    public function getBirthLatitude(): ?string { return $this->birthLatitude; }
    public function setBirthLatitude(?string $v): void { $this->birthLatitude = $v; }
    public function getBirthLongitude(): ?string { return $this->birthLongitude; }
    public function setBirthLongitude(?string $v): void { $this->birthLongitude = $v; }
    public function getBaptismLatitude(): ?string { return $this->baptismLatitude; }
    public function setBaptismLatitude(?string $v): void { $this->baptismLatitude = $v; }
    public function getBaptismLongitude(): ?string { return $this->baptismLongitude; }
    public function setBaptismLongitude(?string $v): void { $this->baptismLongitude = $v; }
    public function getDeathLatitude(): ?string { return $this->deathLatitude; }
    public function setDeathLatitude(?string $v): void { $this->deathLatitude = $v; }
    public function getDeathLongitude(): ?string { return $this->deathLongitude; }
    public function setDeathLongitude(?string $v): void { $this->deathLongitude = $v; }
    public function getOccupation(): ?string { return $this->occupation; }
    public function setOccupation(?string $v): void { $this->occupation = $v; }
    public function isLiving(): bool { return $this->isLiving; }
    public function setIsLiving(bool $v): void { $this->isLiving = $v; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $v): void { $this->notes = $v; }
    public function getBiography(): ?string { return $this->biography; }
    public function setBiography(?string $v): void { $this->biography = $v; }
    public function getPosX(): ?int { return $this->posX; }
    public function setPosX(?int $v): void { $this->posX = $v; }
    public function getPosY(): ?int { return $this->posY; }
    public function setPosY(?int $v): void { $this->posY = $v; }
    public function getGedcomId(): ?string { return $this->gedcomId; }
    public function setGedcomId(?string $v): void { $this->gedcomId = $v; }
    public function getSosa(): ?string { return $this->sosa; }
    public function setSosa(?string $v): void { $this->sosa = $v; }

    public function getBirthDateOriginal(): ?string { return $this->birthDateOriginal; }
    public function setBirthDateOriginal(?string $v): void { $this->birthDateOriginal = $v; }
    public function getDeathDateOriginal(): ?string { return $this->deathDateOriginal; }
    public function setDeathDateOriginal(?string $v): void { $this->deathDateOriginal = $v; }
    public function getBaptismDateOriginal(): ?string { return $this->baptismDateOriginal; }
    public function setBaptismDateOriginal(?string $v): void { $this->baptismDateOriginal = $v; }
}
