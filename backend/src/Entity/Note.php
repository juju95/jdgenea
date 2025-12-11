<?php

namespace App\Entity;

use App\Repository\NoteRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: NoteRepository::class)]
#[ORM\Table(name: 'notes')]
#[ORM\Index(columns: ['gedcom_id'], name: 'idx_note_gedcom_id')]
class Note
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct(string $id, string $content)
    {
        $this->id = $id;
        $this->content = $content;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getContent(): string { return $this->content; }
    public function setContent(string $v): void { $this->content = $v; }
    public function getGedcomId(): ?string { return $this->gedcomId; }
    public function setGedcomId(?string $v): void { $this->gedcomId = $v; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
