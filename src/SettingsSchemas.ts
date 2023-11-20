import { z } from "zod";

export const SettingSchema = z.object({
	commandIds: z.array(z.string()),
});
