"use client";

import { CircleUserRoundIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { useId, useRef } from "react";
import { router, usePage } from "@inertiajs/react";

import { useCharacterLimit } from "@/hooks/use-character-limit";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { update } from "@/routes/profile";

export default function ProfilePopup({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { auth } = usePage().props;
  const user = auth.user;
  const id = useId();

  const maxLength = 180;
  const { value: bio, characterCount, handleChange: handleBioChange, maxLength: limit } = useCharacterLimit({
    initialValue: (user.bio as string | null) ?? "",
    maxLength,
  });

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);

  const [{ files: avatarFiles }, { removeFile: removeAvatar, openFileDialog: openAvatarDialog, getInputProps: getAvatarInputProps }] =
    useFileUpload({ accept: "image/*" });

  const [{ files: bgFiles }, { removeFile: removeBg, openFileDialog: openBgDialog, getInputProps: getBgInputProps }] =
    useFileUpload({
      accept: "image/*",
      initialFiles: user.background_url
        ? [{ id: "bg-initial", name: "background.jpg", size: 0, type: "image/jpeg", url: user.background_url as string }]
        : [],
    });

  const avatarPreview = avatarFiles[0]?.preview ?? (user.avatar_url as string | null) ?? null;
  const bgPreview = bgFiles[0]?.preview ?? null;

  function handleSave() {
    const formData = new FormData();
    formData.append("first_name", firstNameRef.current?.value ?? user.first_name as string);
    formData.append("last_name", lastNameRef.current?.value ?? user.last_name as string);
    formData.append("email", user.email as string);
    formData.append("username", usernameRef.current?.value ?? "");
    formData.append("website", websiteRef.current?.value ?? "");
    formData.append("bio", bio);
    if (avatarFiles[0]?.file instanceof File) {
      formData.append("avatar", avatarFiles[0].file);
    }
    if (bgFiles[0]?.file instanceof File && bgFiles[0].id !== "bg-initial") {
      formData.append("background", bgFiles[0].file);
    }
    formData.append("_method", "PATCH");

    router.post(update().url, formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => onOpenChange?.(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here. You can change your photo and set a username.
        </DialogDescription>
        <div className="overflow-y-auto">
          {/* Background image */}
          <div className="h-32">
            <div className="relative flex size-full items-center justify-center overflow-hidden bg-muted">
              {bgPreview && (
                <img
                  alt="Profile background"
                  className="size-full object-cover"
                  height={128}
                  src={bgPreview}
                  width={512}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <button
                  aria-label={bgPreview ? "Change background" : "Upload background"}
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
            </div>
            <input {...getBgInputProps()} aria-label="Upload background image" className="sr-only" />
          </div>

          {/* Avatar */}
          <div className="-mt-10 px-6">
            <div className="relative inline-flex">
              <Button
                aria-label={avatarPreview ? "Change avatar" : "Upload avatar"}
                className="relative size-20 overflow-hidden rounded-full border-4 border-background p-0 shadow-black/10 shadow-xs"
                onClick={openAvatarDialog}
                variant="outline"
              >
                {avatarPreview ? (
                  <img
                    alt="Avatar preview"
                    className="size-full object-cover"
                    height={80}
                    src={avatarPreview}
                    width={80}
                  />
                ) : (
                  <CircleUserRoundIcon className="size-8 opacity-60" aria-hidden="true" />
                )}
              </Button>
              {avatarFiles[0]?.file && (
                <Button
                  aria-label="Remove avatar"
                  className="-top-1 -right-1 absolute size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                  onClick={() => removeAvatar(avatarFiles[0]?.id)}
                  size="icon"
                >
                  <XIcon className="size-3.5" />
                </Button>
              )}
              <input {...getAvatarInputProps()} aria-label="Upload avatar" className="sr-only" tabIndex={-1} />
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 pt-4 pb-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-first-name`}>First name</Label>
                  <Input
                    ref={firstNameRef}
                    defaultValue={user.first_name as string}
                    id={`${id}-first-name`}
                    placeholder="First name"
                    required
                    type="text"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-last-name`}>Last name</Label>
                  <Input
                    ref={lastNameRef}
                    defaultValue={user.last_name as string}
                    id={`${id}-last-name`}
                    placeholder="Last name"
                    required
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <div className="relative">
                  <Input
                    ref={usernameRef}
                    className="pe-9"
                    defaultValue={(user.username as string | null) ?? ""}
                    id={`${id}-username`}
                    placeholder="your-username"
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-website`}>Website</Label>
                <div className="flex rounded-md shadow-xs">
                  <span className="-z-10 inline-flex items-center rounded-s-md border border-input bg-background px-3 text-muted-foreground text-sm">
                    https://
                  </span>
                  <Input
                    ref={websiteRef}
                    className="-ms-px rounded-s-none shadow-none"
                    defaultValue={(user.website as string | null) ?? ""}
                    id={`${id}-website`}
                    placeholder="yourwebsite.com"
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-bio`}>Biography</Label>
                <Textarea
                  aria-describedby={`${id}-bio-hint`}
                  defaultValue={bio}
                  id={`${id}-bio`}
                  maxLength={maxLength}
                  onChange={handleBioChange}
                  placeholder="Write a few sentences about yourself"
                />
                <p
                  aria-live="polite"
                  className="text-right text-muted-foreground text-xs"
                  id={`${id}-bio-hint`}
                  role="status"
                >
                  <span className="tabular-nums">{limit - characterCount}</span>{" "}
                  characters left
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

