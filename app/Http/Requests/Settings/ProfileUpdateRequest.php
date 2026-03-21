<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            'username' => ['nullable', 'string', 'max:30', 'alpha_dash', Rule::unique('users', 'username')->ignore($this->user()->id)],
            'website' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:180'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'background' => ['nullable', 'image', 'max:5120'],
        ];
    }
}
