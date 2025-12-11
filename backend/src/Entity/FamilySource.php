<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'family_sources')]
class FamilySource
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $familyId;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $sourceId;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $eventType = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomRef = null;

    #[ORM\ManyToOne(targetEntity: Family::class)]
    #[ORM\JoinColumn(name: 'family_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Family $family;

    #[ORM\ManyToOne(targetEntity: Source::class)]
    #[ORM\JoinColumn(name: 'source_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Source $source;

    public function __construct(Family $family, Source $source)
    {
        $this->family = $family;
        $this->familyId = $family->getId();
        $this->source = $source;
        $this->sourceId = $source->getId();
    }

    public function getFamily(): Family { return $this->family; }
    public function getSource(): Source { return $this->source; }
    public function getEventType(): ?string { return $this->eventType; }
    public function setEventType(?string $v): void { $this->eventType = $v; }
    public function getGedcomRef(): ?string { return $this->gedcomRef; }
    public function setGedcomRef(?string $v): void { $this->gedcomRef = $v; }
}
