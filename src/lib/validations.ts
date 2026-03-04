import { z } from 'zod';

export const createUniversitySchema = z.object({
  name: z.string().min(2).max(200),
  country: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
});

export const createDegreeSchema = z.object({
  name: z.string().min(2).max(200),
  universityId: z.string().cuid(),
  description: z.string().max(1000).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(2).max(200),
  degreeId: z.string().cuid(),
  description: z.string().max(1000).optional(),
});

export const createTopicSchema = z.object({
  name: z.string().min(2).max(200),
  subjectId: z.string().cuid(),
  order: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional(),
});

export const createContentSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  type: z.enum(['VIDEO', 'NOTES', 'PDF', 'EXERCISE_SOLUTIONS']),
  topicId: z.string().cuid(),
  isPremium: z.boolean().default(false),
});

export const presignedUrlSchema = z.object({
  filename: z.string().min(1).max(500),
  contentType: z.string().min(1).max(200),
  contentId: z.string().cuid(),
});

export const upgradeRoleSchema = z.object({
  role: z.enum(['CREATOR']),
});
