<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $passwordHash;

    #[ORM\Column(type: 'string', length: 100)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 100)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 20)]
    private string $role = 'free';

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    public function __construct(
        string $id,
        string $email,
        string $passwordHash,
        string $firstName,
        string $lastName,
        string $role = 'free'
    ) {
        $this->id = $id;
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->role = $role;
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getUserIdentifier(): string { return $this->email; }

    public function getRoles(): array { return [$this->mapRoleToSymfonyRole($this->role)]; }

    public function getPassword(): ?string { return $this->passwordHash; }

    public function eraseCredentials(): void {}

    private function mapRoleToSymfonyRole(string $role): string
    {
        return match ($role) {
            'admin' => 'ROLE_ADMIN',
            'premium' => 'ROLE_USER',
            default => 'ROLE_USER',
        };
    }

    public function setPasswordHash(string $hash): void { $this->passwordHash = $hash; }

    public function setUpdatedAt(\DateTimeInterface $at): void { $this->updatedAt = $at; }

    public function getId(): string { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getFirstName(): string { return $this->firstName; }
    public function getLastName(): string { return $this->lastName; }
    public function getRole(): string { return $this->role; }
}
