<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'person_media')]
class PersonMedia
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $personId;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $mediaId;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isPrimary = false;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomRef = null;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(name: 'person_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Person $person;

    #[ORM\ManyToOne(targetEntity: MediaObject::class)]
    #[ORM\JoinColumn(name: 'media_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private MediaObject $media;

    public function __construct(Person $person, MediaObject $media)
    {
        $this->person = $person;
        $this->personId = $person->getId();
        $this->media = $media;
        $this->mediaId = $media->getId();
    }

    public function getPerson(): Person { return $this->person; }
    public function getMedia(): MediaObject { return $this->media; }
    public function isPrimary(): bool { return $this->isPrimary; }
    public function setIsPrimary(bool $v): void { $this->isPrimary = $v; }
    public function getGedcomRef(): ?string { return $this->gedcomRef; }
    public function setGedcomRef(?string $v): void { $this->gedcomRef = $v; }
}
