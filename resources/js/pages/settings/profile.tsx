import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CircleUserRoundIcon, ImagePlusIcon, XIcon } from 'lucide-react';
import { useEffect } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCharacterLimit } from '@/hooks/use-character-limit';
import { useFileUpload } from '@/hooks/use-file-upload';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { update } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        first_name: (user.first_name as string) ?? '',
        last_name: (user.last_name as string) ?? '',
        email: user.email as string,
        username: (user.username as string | null) ?? '',
        website: (user.website as string | null) ?? '',
        bio: (user.bio as string | null) ?? '',
        avatar: null as File | null,
        background: null as File | null,
    });

    const maxLength = 180;
    const { value: bioValue, characterCount, handleChange: handleBioChange, maxLength: limit } = useCharacterLimit({
        initialValue: data.bio,
        maxLength,
    });

    const [{ files: avatarFiles }, { removeFile: removeAvatar, openFileDialog: openAvatarDialog, getInputProps: getAvatarInputProps }] =
        useFileUpload({ accept: 'image/*' });

    const [{ files: bgFiles }, { removeFile: removeBg, openFileDialog: openBgDialog, getInputProps: getBgInputProps }] =
        useFileUpload({
            accept: 'image/*',
            initialFiles: user.background_url
                ? [{ id: 'bg-initial', name: 'background.jpg', size: 0, type: 'image/jpeg', url: user.background_url as string }]
                : [],
        });

    useEffect(() => {
        const file = avatarFiles[0]?.file;
        if (file instanceof File) {
            setData('avatar', file);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avatarFiles]);

    useEffect(() => {
        const file = bgFiles[0]?.file;
        if (file instanceof File && bgFiles[0].id !== 'bg-initial') {
            setData('background', file);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bgFiles]);

    const avatarPreview = avatarFiles[0]?.preview ?? (user.avatar_url as string | null) ?? null;
    const bgPreview = bgFiles[0]?.preview ?? null;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setData('bio', bioValue);
        patch(update().url, { preserveScroll: true, forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your profile photo, name, and other details"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Background image strip */}
                        <div className="h-32 rounded-lg overflow-hidden">
                            <div className="relative flex size-full items-center justify-center bg-muted">
                                {bgPreview && (
                                    <img
                                        alt="Profile background"
                                        className="size-full object-cover"
                                        src={bgPreview}
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-2">
                                    <button
                                        aria-label={bgPreview ? 'Change background' : 'Upload background'}
                                        className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        onClick={openBgDialog}
                                        type="button"
                                    >
                                        <ImagePlusIcon aria-hidden="true" size={16} />
                                    </button>
                                    {bgPreview && (
                                        <button
                                            aria-label="Remove background"
                                            className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            onClick={() => removeBg(bgFiles[0]?.id)}
                                            type="button"
                                        >
                                            <XIcon aria-hidden="true" size={16} />
                                        </button>
                                    )}
                                </div>
                                <input {...getBgInputProps()} className="sr-only" aria-label="Upload background image" />
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="-mt-6 px-4">
                            <div className="relative inline-flex">
                                <button
                                    aria-label="Change avatar"
                                    className="group relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                                    onClick={openAvatarDialog}
                                    type="button"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <CircleUserRoundIcon className="size-8 text-muted-foreground" aria-hidden="true" />
                                    )}
                                    <div className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/40 group-hover:flex">
                                        <ImagePlusIcon className="size-4 text-white" aria-hidden="true" />
                                    </div>
                                </button>
                                {avatarPreview && user.avatar_url && (
                                    <button
                                        aria-label="Remove avatar"
                                        className="absolute -top-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground outline-none"
                                        onClick={() => removeAvatar(avatarFiles[0]?.id)}
                                        type="button"
                                    >
                                        <XIcon size={10} aria-hidden="true" />
                                    </button>
                                )}
                                <input {...getAvatarInputProps()} className="sr-only" aria-label="Upload avatar image" />
                            </div>
                        </div>

                        {/* Name fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First name</Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    required
                                    autoComplete="given-name"
                                    placeholder="First name"
                                />
                                <InputError message={errors.first_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last name</Label>
                                <Input
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    required
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                />
                                <InputError message={errors.last_name} />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                                    @
                                </span>
                                <Input
                                    id="username"
                                    className="rounded-l-none"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    autoComplete="username"
                                    placeholder="username"
                                />
                            </div>
                            <InputError message={errors.username} />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="Email address"
                            />
                            <InputError message={errors.email} />
                        </div>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Website */}
                        <div className="grid gap-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                                    https://
                                </span>
                                <Input
                                    id="website"
                                    className="rounded-l-none"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="example.com"
                                />
                            </div>
                            <InputError message={errors.website} />
                        </div>

                        {/* Bio */}
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bioValue}
                                onChange={handleBioChange}
                                maxLength={limit}
                                placeholder="Tell us a little about yourself"
                                className="resize-none"
                                rows={3}
                            />
                            <p className="text-right text-xs text-muted-foreground">
                                {characterCount}/{limit}
                            </p>
                            <InputError message={errors.bio} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                Save
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
