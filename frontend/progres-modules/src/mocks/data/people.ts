/** Synthetic, anonymised people shared by admissions and student-records mocks. */
import { createRng } from '../seed';

export interface Person {
  id: string;
  /** 12-digit student identifier */
  studentId: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  birthDate: string;
  birthPlace: string;
  nationality: string;
  email: string;
  phone: string;
  address: string;
}

const MALE = ['Mohamed', 'Ahmed', 'Youssef', 'Karim', 'Anis', 'Walid', 'Riad', 'Sofiane', 'Bilal', 'Amine', 'Nassim', 'Hamza', 'Ilyes', 'Zakaria', 'Mehdi', 'Rayan', 'Abdelkader', 'Fares', 'Yacine', 'Mourad'];
const FEMALE = ['Fatima Zahra', 'Amina', 'Sarah', 'Imane', 'Lina', 'Meriem', 'Yasmine', 'Khadija', 'Nour', 'Ikram', 'Aya', 'Rania', 'Selma', 'Hanane', 'Asma', 'Dounia', 'Wafa', 'Lamia', 'Nesrine', 'Sihem'];
const LAST = ['Benali', 'Kharroubi', 'El Mansouri', 'Bouzid', 'Haddad', 'Khelifi', 'Boudiaf', 'Saidi', 'Merabet', 'Belkacem', 'Cherif', 'Hamidi', 'Mebarki', 'Zerrouki', 'Ouali', 'Bensalem', 'Taleb', 'Rahmani', 'Amrani', 'Djebbar', 'Lakhdar', 'Slimani', 'Ferhat', 'Guerfi', 'Messaoudi', 'Brahimi', 'Larbi', 'Sebti', 'Touati', 'Yahiaoui'];
const CITIES = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Batna', 'Khenchela', 'Sétif', 'Tlemcen', 'Béjaïa', 'Biskra', 'Blida', 'Tizi Ouzou', 'Skikda', 'Ghardaïa', 'Médéa'];
const STREETS = ['Rue des Frères Bouchama', 'Cité 5 Juillet', 'Boulevard de l\'ALN', 'Rue Didouche Mourad', 'Cité des Orangers', 'Rue de la Liberté', 'Lotissement El Wiam', 'Cité Universitaire'];

const rng = createRng(77);

export const PEOPLE_COUNT = 320;

export const people: Person[] = Array.from({ length: PEOPLE_COUNT }, (_, i) => {
  const sex: 'M' | 'F' = rng.chance(0.5) ? 'M' : 'F';
  const firstName = rng.pick(sex === 'M' ? MALE : FEMALE);
  const lastName = rng.pick(LAST);
  const entry = 2019 + (i % 8); // entry year spreads over cohorts
  const birthYear = entry - rng.int(18, 20);
  const city = rng.pick(CITIES);
  return {
    id: `P${String(i + 1).padStart(4, '0')}`,
    studentId: `${entry}${String(30000 + i * 7 + rng.int(0, 5)).padStart(8, '0')}`,
    firstName,
    lastName,
    sex,
    birthDate: `${birthYear}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
    birthPlace: rng.pick(CITIES),
    nationality: 'Algérienne',
    email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}${i}@etu-demo.dz`,
    phone: `0${rng.pick([5, 6, 7])}${rng.int(50, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
    address: `${rng.int(1, 120)} ${rng.pick(STREETS)}, ${city}`,
  };
});

export const fullName = (p: Pick<Person, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName.toUpperCase()}`;
