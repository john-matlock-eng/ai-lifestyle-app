import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../features/auth/services/authService";
import type { UserProfile } from "../../features/auth/services/authService";
import Button from "../common/Button";

interface Props {
  user: UserProfile;
}

interface FormValues {
  displayName: string;
  firstName: string;
  lastName: string;
}

const ProfileSection: React.FC<Props> = ({ user }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  const mutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) => authService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const onSubmit = handleSubmit((formData) => {
    mutation.mutate(formData);
  });

  return (
    <div className="bg-[var(--surface)] shadow sm:rounded-lg p-6">
      <h3 className="text-lg leading-6 font-medium text-[var(--text)] mb-4">Profile</h3>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            className="input w-full"
            {...register("displayName", { required: true })}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">Display name is required</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstName">First Name</label>
            <input id="firstName" className="input w-full" {...register("firstName")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastName">Last Name</label>
            <input id="lastName" className="input w-full" {...register("lastName")} />
          </div>
        </div>
        <Button type="submit" isLoading={mutation.isPending}>Save</Button>
      </form>
    </div>
  );
};

export default ProfileSection;
