import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const creator = await prisma.user.upsert({
    where: { email: 'creator@demo.com' },
    update: {},
    create: {
      email: 'creator@demo.com',
      name: 'Demo Creator',
      role: 'CREATOR',
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      email: 'student@demo.com',
      name: 'Demo Student',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // Create UPM
  const upm = await prisma.university.upsert({
    where: { slug: 'universidad-politecnica-de-madrid' },
    update: {},
    create: {
      name: 'Universidad Politécnica de Madrid',
      slug: 'universidad-politecnica-de-madrid',
      country: 'Spain',
      city: 'Madrid',
      description: 'Technical university in Madrid, Spain.',
      createdById: admin.id,
    },
  });

  // Create UCL
  const ucl = await prisma.university.upsert({
    where: { slug: 'university-college-london' },
    update: {},
    create: {
      name: 'University College London',
      slug: 'university-college-london',
      country: 'UK',
      city: 'London',
      description: 'Leading multidisciplinary university in London.',
      createdById: admin.id,
    },
  });

  // UPM Electrical Engineering
  const electricalEng = await prisma.degree.upsert({
    where: { universityId_slug: { universityId: upm.id, slug: 'electrical-engineering' } },
    update: {},
    create: {
      name: 'Electrical Engineering',
      slug: 'electrical-engineering',
      universityId: upm.id,
      createdById: admin.id,
    },
  });

  // Subject
  const matematics = await prisma.subject.upsert({
    where: { degreeId_slug: { degreeId: electricalEng.id, slug: 'ampliacion-de-matematicas' } },
    update: {},
    create: {
      name: 'Ampliación de Matemáticas',
      slug: 'ampliacion-de-matematicas',
      degreeId: electricalEng.id,
      description: 'Advanced mathematics for electrical engineers.',
      createdById: creator.id,
    },
  });

  // Topics
  const topic1 = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: matematics.id, slug: 'tema-1-campos-vectoriales' } },
    update: {},
    create: {
      name: 'Tema 1: Campos vectoriales y escalares',
      slug: 'tema-1-campos-vectoriales',
      subjectId: matematics.id,
      order: 1,
      createdById: creator.id,
    },
  });

  const topic2 = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: matematics.id, slug: 'tema-2-integrales-de-linea' } },
    update: {},
    create: {
      name: 'Tema 2: Integrales de línea',
      slug: 'tema-2-integrales-de-linea',
      subjectId: matematics.id,
      order: 2,
      createdById: creator.id,
    },
  });

  const topic3 = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: matematics.id, slug: 'tema-3-teorema-de-green' } },
    update: {},
    create: {
      name: 'Tema 3: Teorema de Green',
      slug: 'tema-3-teorema-de-green',
      subjectId: matematics.id,
      order: 3,
      createdById: creator.id,
    },
  });

  console.log('Seed complete!');
  console.log({ upm: upm.id, ucl: ucl.id, topic1: topic1.id, topic2: topic2.id, topic3: topic3.id });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
