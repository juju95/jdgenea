<?php

namespace App\Entity;

use App\Repository\SourceRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SourceRepository::class)]
#[ORM\Table(name: 'sources')]
#[ORM\Index(columns: ['gedcom_id'], name: 'idx_source_gedcom_id')]
class Source
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $author = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $publication = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $text = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct(string $id, string $title)
    {
        $this->id = $id;
        $this->title = $title;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $v): void { $this->title = $v; }
    public function getAuthor(): ?string { return $this->author; }
    public function setAuthor(?string $v): void { $this->author = $v; }
    public function getPublication(): ?string { return $this->publication; }
    public function setPublication(?string $v): void { $this->publication = $v; }
    public function getText(): ?string { return $this->text; }
    public function setText(?string $v): void { $this->text = $v; }
    public function getGedcomId(): ?string { return $this->gedcomId; }
    public function setGedcomId(?string $v): void { $this->gedcomId = $v; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
