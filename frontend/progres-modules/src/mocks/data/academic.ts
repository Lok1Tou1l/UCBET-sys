/**
 * Mock academic structure store: Semester → Teaching Unit (UE) → Subject for every program version.
 * (Domain → Field → Specialty → Program lives in ./catalog.ts.) Everything is synthetic.
 */
import { createRng, currentAcademicYear } from '../seed';
import { domainById, fieldById, programs, specialtyById, type CatalogProgram } from './catalog';
import type { AcademicLevel } from '@/types/common';
import type { UEType } from '@/modules/records/types';

export interface SemRec {
  id: string;
  programId: string;
  versionId: string;
  number: number;
  name: string;
  nameAr: string;
  academicYear: string;
}
export interface UERec {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  nameAr: string;
  type: UEType;
  credits: number;
  coefficient: number;
}
export interface SubRec {
  id: string;
  ueId: string;
  code: string;
  name: string;
  nameAr: string;
  coefficient: number;
  lectureHours: number;
  tdHours: number;
  tpHours: number;
}

export const semesters: SemRec[] = [];
export const ues: UERec[] = [];
export const subjects: SubRec[] = [];

export const currentYear = currentAcademicYear();
export const HISTORICAL_YEAR = '2023/2024';

export const FIRST_SEMESTER: Record<AcademicLevel, number> = { L1: 1, L2: 3, L3: 5, M1: 7, M2: 9 };

type Pair = [string, string];
const FUND: Record<string, Pair[]> = {
  ST: [['Résistance des matériaux', 'مقاومة المواد'], ['Mécanique des sols', 'ميكانيك التربة'], ['Béton armé', 'الخرسانة المسلحة'], ['Topographie', 'الطبوغرافيا'], ['Hydraulique générale', 'الهيدروليك العام'], ['Électronique fondamentale', 'الإلكترونيك الأساسي'], ['Théorie du signal', 'نظرية الإشارة'], ['Circuits électriques', 'الدارات الكهربائية'], ['Thermodynamique', 'الترموديناميك'], ['Mécanique du point', 'ميكانيك النقطة المادية'], ['Géologie de l\'ingénieur', 'جيولوجيا المهندس'], ['Matériaux de construction', 'مواد البناء']],
  MI: [['Algorithmique et structures de données', 'الخوارزميات وهياكل المعطيات'], ['Analyse mathématique', 'التحليل الرياضي'], ['Algèbre linéaire', 'الجبر الخطي'], ['Systèmes d\'exploitation', 'أنظمة التشغيل'], ['Bases de données', 'قواعد البيانات'], ['Architecture des ordinateurs', 'بنية الحاسوب'], ['Probabilités et statistiques', 'الاحتمالات والإحصاء'], ['Réseaux informatiques', 'الشبكات الحاسوبية'], ['Programmation orientée objet', 'البرمجة كائنية التوجه'], ['Logique mathématique', 'المنطق الرياضي'], ['Théorie des graphes', 'نظرية البيان'], ['Apprentissage automatique', 'التعلم الآلي']],
  SEGC: [['Microéconomie', 'الاقتصاد الجزئي'], ['Macroéconomie', 'الاقتصاد الكلي'], ['Comptabilité générale', 'المحاسبة العامة'], ['Management des organisations', 'تسيير المنظمات'], ['Mathématiques financières', 'الرياضيات المالية'], ['Marketing fondamental', 'التسويق الأساسي'], ['Gestion financière', 'التسيير المالي'], ['Droit commercial', 'القانون التجاري'], ['Statistiques appliquées', 'الإحصاء التطبيقي'], ['Économétrie', 'القياس الاقتصادي'], ['Analyse financière', 'التحليل المالي'], ['Fiscalité', 'الجباية']],
  SNV: [['Biologie cellulaire', 'البيولوجيا الخلوية'], ['Biochimie structurale', 'الكيمياء الحيوية البنيوية'], ['Génétique', 'علم الوراثة'], ['Microbiologie', 'علم الأحياء الدقيقة'], ['Physiologie animale', 'فيزيولوجيا الحيوان'], ['Immunologie', 'علم المناعة'], ['Enzymologie', 'علم الأنزيمات'], ['Biologie moléculaire', 'البيولوجيا الجزيئية'], ['Écologie générale', 'البيئة العامة'], ['Chimie organique', 'الكيمياء العضوية'], ['Métabolisme', 'الاستقلاب'], ['Biostatistiques', 'الإحصاء الحيوي']],
  LLE: [['Linguistique générale', 'اللسانيات العامة'], ['Littérature française', 'الأدب الفرنسي'], ['Phonétique et phonologie', 'الصوتيات'], ['Grammaire du français', 'قواعد اللغة الفرنسية'], ['Expression écrite', 'التعبير الكتابي'], ['Didactique des langues', 'تعليمية اللغات'], ['Analyse du discours', 'تحليل الخطاب'], ['Littérature francophone', 'الأدب الفرنكفوني'], ['Sémantique', 'علم الدلالة'], ['Pragmatique', 'التداولية'], ['Traduction', 'الترجمة'], ['Psychologie de l\'apprentissage', 'علم نفس التعلم']],
};
const METHOD: Pair[] = [['Méthodologie du travail universitaire', 'منهجية العمل الجامعي'], ['Techniques d\'expression', 'تقنيات التعبير'], ['Travaux pratiques de laboratoire', 'أشغال تطبيقية مخبرية'], ['Outils informatiques', 'الأدوات المعلوماتية'], ['Méthodes quantitatives', 'الطرق الكمية'], ['Initiation à la recherche documentaire', 'مدخل إلى البحث الوثائقي'], ['Dessin technique', 'الرسم التقني'], ['Méthodes de recherche', 'مناهج البحث']];
const DISCOVERY: Pair[] = [['Histoire des sciences', 'تاريخ العلوم'], ['Énergies renouvelables', 'الطاقات المتجددة'], ['Culture numérique', 'الثقافة الرقمية'], ['Environnement et développement durable', 'البيئة والتنمية المستدامة'], ['Initiation à l\'entrepreneuriat', 'مدخل إلى المقاولاتية'], ['Santé et société', 'الصحة والمجتمع']];
const TRANSVERSAL: Pair[] = [['Anglais scientifique', 'الإنجليزية العلمية'], ['Langue et terminologie', 'اللغة والمصطلحات'], ['Droits de l\'homme', 'حقوق الإنسان'], ['Éthique et déontologie', 'الأخلاقيات والآداب المهنية'], ['Communication professionnelle', 'التواصل المهني'], ['Culture générale', 'الثقافة العامة']];

const UE_LABEL: Record<UEType, [string, string, string]> = {
  fundamental: ['UE Fondamentale', 'وحدة تعليم أساسية', 'F'],
  methodological: ['UE Méthodologique', 'وحدة تعليم منهجية', 'M'],
  discovery: ['UE Découverte', 'وحدة تعليم استكشافية', 'D'],
  transversal: ['UE Transversale', 'وحدة تعليم أفقية', 'T'],
};

/** Credit template per version: [type, credits]; each semester totals 30 credits. */
const TEMPLATES: Record<string, [UEType, number][]> = {
  v1: [['fundamental', 9], ['fundamental', 9], ['methodological', 6], ['discovery', 3], ['transversal', 3]],
  v2: [['fundamental', 8], ['fundamental', 8], ['methodological', 6], ['discovery', 4], ['transversal', 4]],
};

function build(program: CatalogProgram) {
  const spec = specialtyById(program.specialtyId)!;
  const domain = domainById(fieldById(spec.fieldId)!.domainId)!;
  const fundPool = FUND[domain.code] ?? FUND.MI;
  for (const version of program.versions) {
    const rng = createRng(program.id.length * 997 + version.startYear + [...program.id].reduce((a, c) => a + c.charCodeAt(0), 0));
    const tpl = TEMPLATES[version.isCurrent ? 'v2' : 'v1'];
    for (let k = 0; k < 2; k++) {
      const number = FIRST_SEMESTER[program.level] + k;
      const sem: SemRec = { id: `sem-${program.id}-${version.id.slice(-2)}-s${number}`, programId: program.id, versionId: version.id, number, name: `Semestre ${number}`, nameAr: `السداسي ${number}`, academicYear: version.isCurrent ? currentYear : HISTORICAL_YEAR };
      semesters.push(sem);
      const counters: Record<UEType, number> = { fundamental: 0, methodological: 0, discovery: 0, transversal: 0 };
      tpl.forEach(([type, credits]) => {
        const n = ++counters[type];
        const [lbl, lblAr, letter] = UE_LABEL[type];
        const ueCode = `UE${letter}${number}${n}`;
        const ue: UERec = { id: `${sem.id}-${ueCode}`, semesterId: sem.id, code: ueCode, name: `${lbl} ${n}`, nameAr: `${lblAr} ${n}`, type, credits, coefficient: Math.max(1, Math.round(credits / 2)) };
        ues.push(ue);
        const pool = type === 'fundamental' ? fundPool : type === 'methodological' ? METHOD : type === 'discovery' ? DISCOVERY : TRANSVERSAL;
        const count = type === 'fundamental' ? 2 : type === 'methodological' ? 2 : 1;
        for (let s = 0; s < count; s++) {
          const [name, nameAr] = pool[(rng.int(0, pool.length - 1) + s * 3 + number) % pool.length];
          subjects.push({
            id: `${ue.id}-m${s + 1}`,
            ueId: ue.id,
            code: `${ueCode}-${s + 1}`,
            name,
            nameAr,
            coefficient: rng.pick([1, 1.5, 2, 2, 3]),
            lectureHours: type === 'transversal' || type === 'discovery' ? 21 : rng.pick([21, 22.5, 45]),
            tdHours: type === 'discovery' ? 0 : rng.pick([0, 21, 22.5]),
            tpHours: type === 'methodological' || type === 'fundamental' ? rng.pick([0, 0, 21, 22.5]) : 0,
          });
        }
      });
    }
  }
}
programs.forEach(build);

export const semesterById = (id: string) => semesters.find((s) => s.id === id);
export const ueById = (id: string) => ues.find((u) => u.id === id);
export const uesOfSemester = (semesterId: string) => ues.filter((u) => u.semesterId === semesterId);
export const subjectsOfUE = (ueId: string) => subjects.filter((s) => s.ueId === ueId);
export const semestersOfProgramVersion = (programId: string, versionId: string) => semesters.filter((s) => s.programId === programId && s.versionId === versionId).sort((a, b) => a.number - b.number);
