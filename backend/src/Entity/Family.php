<?php

namespace App\Entity;

use App\Repository\FamilyRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FamilyRepository::class)]
#[ORM\Table(name: 'families')]
class Family
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 36)]
    private string $treeId;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $husbandId = null;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $wifeId = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeInterface $marriageDate = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $marriagePlace = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeInterface $marriageTime = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8, nullable: true)]
    private ?string $marriageLatitude = null;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8, nullable: true)]
    private ?string $marriageLongitude = null;

    public function getId(): string { return $this->id; }
    public function setId(string $v): void { $this->id = $v; }
    public function getTreeId(): string { return $this->treeId; }
    public function setTreeId(string $v): void { $this->treeId = $v; }
    public function getHusbandId(): ?string { return $this->husbandId; }
    public function setHusbandId(?string $v): void { $this->husbandId = $v; }
    public function getWifeId(): ?string { return $this->wifeId; }
    public function setWifeId(?string $v): void { $this->wifeId = $v; }
    public function getMarriageDate(): ?\DateTimeInterface { return $this->marriageDate; }
    public function setMarriageDate(?\DateTimeInterface $v): void { $this->marriageDate = $v; }
    public function getMarriagePlace(): ?string { return $this->marriagePlace; }
    public function setMarriagePlace(?string $v): void { $this->marriagePlace = $v; }
    public function getMarriageTime(): ?\DateTimeInterface { return $this->marriageTime; }
    public function setMarriageTime(?\DateTimeInterface $v): void { $this->marriageTime = $v; }
    public function getMarriageLatitude(): ?string { return $this->marriageLatitude; }
    public function setMarriageLatitude(?string $v): void { $this->marriageLatitude = $v; }
    public function getMarriageLongitude(): ?string { return $this->marriageLongitude; }
    public function setMarriageLongitude(?string $v): void { $this->marriageLongitude = $v; }
}
