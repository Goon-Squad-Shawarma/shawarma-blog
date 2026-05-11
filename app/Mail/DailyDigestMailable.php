<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class DailyDigestMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $author,
        public User $recipient,
        public Collection $blogs,
    ) {}

    public function envelope(): Envelope
    {
        $name = $this->author->first_name.' '.$this->author->last_name;

        return new Envelope(
            subject: "Your daily digest from {$name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.daily-digest',
            with: [
                'author' => $this->author,
                'recipient' => $this->recipient,
                'blogs' => $this->blogs,
            ],
        );
    }
}
