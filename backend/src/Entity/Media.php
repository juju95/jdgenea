<?php

namespace App\Entity;

use App\Repository\MediaRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MediaRepository::class)]
#[ORM\Table(name: 'media')]
class Media
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 36)]
    private string $personId;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $eventId = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $fileName;

    #[ORM\Column(type: 'string', length: 500)]
    private string $filePath;

    #[ORM\Column(type: 'string', length: 50)]
    private string $fileType;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function getId(): string { return $this->id; }
    public function setId(string $v): void { $this->id = $v; }
    public function getPersonId(): string { return $this->personId; }
    public function setPersonId(string $v): void { $this->personId = $v; }
    public function getEventId(): ?string { return $this->eventId; }
    public function setEventId(?string $v): void { $this->eventId = $v; }
    public function getFileName(): string { return $this->fileName; }
    public function setFileName(string $v): void { $this->fileName = $v; }
    public function getFilePath(): string { return $this->filePath; }
    public function setFilePath(string $v): void { $this->filePath = $v; }
    public function getFileType(): string { return $this->fileType; }
    public function setFileType(string $v): void { $this->fileType = $v; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function setCreatedAt(\DateTimeInterface $v): void { $this->createdAt = $v; }
}
