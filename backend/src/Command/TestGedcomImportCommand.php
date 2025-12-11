<?php

namespace App\Command;

use App\Service\GedcomImport\GedcomImportService;
use App\Entity\Tree;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:test-gedcom-import',
    description: 'Tests the new GEDCOM import service',
)]
class TestGedcomImportCommand extends Command
{
    public function __construct(
        private GedcomImportService $importService,
        private TreeRepository $treeRepository,
        private EntityManagerInterface $em
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('filePath', InputArgument::REQUIRED, 'Path to GEDCOM file')
            ->addArgument('treeName', InputArgument::OPTIONAL, 'Name of test tree', 'Test Tree')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $filePath = $input->getArgument('filePath');
        $treeName = $input->getArgument('treeName');

        if (!file_exists($filePath)) {
            $io->error("File not found: $filePath");
            return Command::FAILURE;
        }

        // Create or find tree
        $tree = $this->treeRepository->findOneBy(['name' => $treeName]);
        if (!$tree) {
            // Use a dummy user ID for testing
            $userId = 'test-user-id';
            $tree = new Tree($this->uuid(), $userId, $treeName);
            
            $this->em->persist($tree);
            $this->em->flush();
            $io->success("Created new tree: $treeName ({$tree->getId()})");
        } else {
            $io->info("Using existing tree: $treeName ({$tree->getId()})");
        }

        $io->title("Importing GEDCOM from $filePath into tree {$tree->getId()}");

        $start = microtime(true);
        $result = $this->importService->import($filePath, $tree->getId());
        $end = microtime(true);

        if ($result['status'] === 'done') {
            $io->success("Import completed in " . round($end - $start, 2) . "s");
            $io->table(
                ['Entity', 'Count'],
                [
                    ['Sources', $result['sources']],
                    ['Media', $result['media']],
                    ['Persons', $result['persons']],
                    ['Families', $result['families']],
                ]
            );
            return Command::SUCCESS;
        } else {
            $io->error("Import failed: " . json_encode($result['errors']));
            return Command::FAILURE;
        }
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
        $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
        $h = bin2hex($d);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }
}
