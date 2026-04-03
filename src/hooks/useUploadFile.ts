import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";
import { useBlossomServers } from "./useBlossomServers";

export function useUploadFile() {
  const { user } = useCurrentUser();
  const { servers } = useBlossomServers();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      if (servers.length === 0) {
        throw new Error('No Blossom servers configured');
      }

      const errors: Error[] = [];

      for (const server of servers) {
        try {
          const uploader = new BlossomUploader({
            servers: [server],
            signer: user.signer,
          });

          const tags = await uploader.upload(file);
          return tags;
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
          continue;
        }
      }

      throw new Error(`All Blossom servers failed. Last error: ${errors[errors.length - 1]?.message}`);
    },
  });
}
