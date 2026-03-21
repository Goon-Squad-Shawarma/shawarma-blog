<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NovuService
{
    private string $baseUrl = 'https://api.novu.co/v1';

    public function __construct(private readonly string $secretKey)
    {
        //
    }

    public function createSubscriber(User $user): void
    {
        $response = $this->client()->post("{$this->baseUrl}/subscribers", [
            'subscriberId' => $user->uuid,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'email' => $user->email,
        ]);

        $this->logIfFailed($response, 'createSubscriber', $user->uuid);
    }

    public function updateSubscriber(User $user): void
    {
        $response = $this->client()->patch("{$this->baseUrl}/subscribers/{$user->uuid}", [
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'email' => $user->email,
            'avatar' => $user->avatar_url,
        ]);

        $this->logIfFailed($response, 'updateSubscriber', $user->uuid);
    }

    public function deleteSubscriber(string $subscriberUuid): void
    {
        $response = $this->client()->delete("{$this->baseUrl}/subscribers/{$subscriberUuid}");

        $this->logIfFailed($response, 'deleteSubscriber', $subscriberUuid);
    }

    public function triggerWorkflow(string $workflowId, string $subscriberUuid, array $payload = []): void
    {
        $body = [
            'name' => $workflowId,
            'to' => ['subscriberId' => $subscriberUuid],
        ];

        if (! empty($payload)) {
            $body['payload'] = $payload;
        }

        $response = $this->client()->post("{$this->baseUrl}/events/trigger", $body);

        $this->logIfFailed($response, "triggerWorkflow:{$workflowId}", $subscriberUuid);
    }

    private function client(): PendingRequest
    {
        return Http::withHeaders(['Authorization' => "ApiKey {$this->secretKey}"])
            ->acceptJson()
            ->asJson();
    }

    private function logIfFailed(Response $response, string $operation, string $subscriberUuid): void
    {
        if ($response->failed()) {
            Log::error("Novu {$operation} failed for subscriber {$subscriberUuid}", [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
        }
    }
}
