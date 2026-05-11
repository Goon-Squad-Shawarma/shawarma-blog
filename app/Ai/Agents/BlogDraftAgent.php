<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

#[Temperature(0.8)]
#[MaxTokens(4096)]
class BlogDraftAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function __construct(
        public readonly string $topic,
        public readonly ?string $outline = null,
    ) {}

    public function instructions(): Stringable|string
    {
        $instructions = 'You are an expert blog writer. Write engaging, well-structured blog content.
Always return valid HTML with proper headings (h2, h3), paragraphs, and lists where appropriate.
Content should be informative, readable, and between 400–800 words.';

        if ($this->outline !== null) {
            $instructions .= "\n\nFollow this outline:\n{$this->outline}";
        }

        return $instructions;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->required(),
            'content' => $schema->string()->required(),
        ];
    }
}
