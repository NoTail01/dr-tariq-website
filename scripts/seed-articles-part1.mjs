/**
 * Seed content for the 10 doctor-review articles.
 *
 * Arabic texts are the approved originals supplied by the client; English
 * versions are faithful translations of the same structure. Bodies end with
 * related-article links, the educational notice, and a link to the
 * appointment page. Nothing here is invented: every article cites its
 * source, and no author, reviewer, approval or date is fabricated.
 *
 * Consumed by `scripts/import-articles.mjs` (repeatable, dedupes by slug).
 */

const RELATED = {
  ar: {
    "chronic-kidney-disease": "مرض الكلى المزمن: لماذا قد تحتاج إلى الفحص رغم غياب الأعراض؟",
    "kidney-function-tests": "فحوصات وظائف الكلى: ما الفرق بين الكرياتينين وeGFR وزلال البول؟",
    "blood-pressure-kidney-health": "ارتفاع ضغط الدم والكلى: علاقة تحتاج إلى متابعة منتظمة",
    "diabetes-kidney-health": "السكري والكلى: لماذا تبقى الفحوصات مهمة حتى عندما تشعر أنك بخير؟",
    "albumin-in-urine": "الزلال في البول: ماذا يعني وجود الألبومين وكيف تتم متابعته؟",
    "kidney-stone-symptoms": "أعراض حصى الكلى: متى يحتاج الألم إلى تقييم عاجل؟",
    "preventing-kidney-stones": "الوقاية من تكرار حصى الكلى: هل توجد حمية واحدة للجميع؟",
    "acute-kidney-injury": "إصابة الكلى الحادة: لماذا يحتاج التغير المفاجئ في وظائف الكلى إلى الاهتمام؟",
    "home-blood-pressure-monitoring": "قياس ضغط الدم في المنزل: كيف تجعل القراءات أكثر فائدة للطبيب؟",
    "kidney-transplant-follow-up": "زراعة الكلى: لماذا تستمر المتابعة الطبية بعد العملية؟",
  },
  en: {
    "chronic-kidney-disease": "Chronic Kidney Disease: Why You May Need Testing Even Without Symptoms",
    "kidney-function-tests": "Kidney Function Tests: Creatinine, eGFR and Urine Albumin Explained",
    "blood-pressure-kidney-health": "Blood Pressure and the Kidneys: A Relationship Worth Monitoring",
    "diabetes-kidney-health": "Diabetes and the Kidneys: Why Testing Still Matters When You Feel Well",
    "albumin-in-urine": "Albumin in the Urine: What It Means and How It Is Followed Up",
    "kidney-stone-symptoms": "Kidney Stone Symptoms: When Pain Needs Urgent Assessment",
    "preventing-kidney-stones": "Preventing Recurrent Kidney Stones: Is There One Diet for Everyone?",
    "acute-kidney-injury": "Acute Kidney Injury: Why a Sudden Change Needs Attention",
    "home-blood-pressure-monitoring": "Home Blood Pressure Monitoring: Making Readings Useful for Your Doctor",
    "kidney-transplant-follow-up": "Kidney Transplantation: Why Medical Follow-up Continues Afterwards",
  },
};

/** Related-article block, educational notice and appointment link, per locale. */
function closing(locale, slugs) {
  const base = locale === "ar" ? "/ar/blog" : "/en/blog";
  const bookHref = locale === "ar" ? "/ar/book" : "/en/book";
  const relatedTitle = RELATED[locale];
  const items = slugs
    .map((slug) => `- [${relatedTitle[slug]}](${base}/${slug})`)
    .join("\n");
  const relatedHeading = locale === "ar" ? "## مقالات ذات صلة" : "## Related articles";
  const notice =
    locale === "ar"
      ? "**محتوى تثقيفي عام، ولا يغني عن التقييم الطبي الفردي.**"
      : "**General educational content; it does not replace an individual medical assessment.**";
  const cta =
    locale === "ar"
      ? `للتواصل مع العيادة وتحديد موعد: [تواصل مع العيادة لتحديد موعد](${bookHref})`
      : `To contact the clinic and arrange an appointment: [Contact the Clinic for an Appointment](${bookHref})`;
  return `\n\n${relatedHeading}\n\n${items}\n\n${notice}\n\n${cta}`;
}

export const SEED_ARTICLES = [
  {
    slug: "chronic-kidney-disease",
    category: "guides",
    title: {
      ar: "مرض الكلى المزمن: لماذا قد تحتاج إلى الفحص رغم غياب الأعراض؟",
      en: "Chronic Kidney Disease: Why You May Need Testing Even Without Symptoms",
    },
    excerpt: {
      ar: "قد تبدأ أمراض الكلى من دون علامات واضحة. تعرّف على من يحتاج إلى فحص وظائف الكلى، وكيف يتم التقييم، ولماذا لا يكفي الشعور بأنك بخير.",
      en: "Kidney disease can begin without clear signs. Learn who should be tested for kidney function, how it is assessed, and why feeling well is not enough.",
    },
    seo: {
      title: {
        ar: "مرض الكلى المزمن: الأعراض الصامتة ومن يحتاج إلى الفحص",
        en: "Chronic Kidney Disease: Silent Signs and Who Needs Testing",
      },
      description: {
        ar: "دليل مبسّط عن مرض الكلى المزمن: من يحتاج إلى الفحص رغم غياب الأعراض، وكيف يعتمد التقييم على فحوصات الدم والبول مع الدكتور طارق أبو حويج.",
        en: "A plain-language guide to chronic kidney disease: who needs testing even without symptoms, and why assessment relies on blood and urine tests.",
      },
    },
    sourceUrl: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd",
    body: {
      ar: `قد تبدأ أمراض الكلى من دون علامات واضحة. لذلك، الشعور بأنك بخير لا يكفي وحده للحكم على صحة الكلى، خصوصًا عند وجود عوامل خطر تستدعي المتابعة.

## ما المقصود بمرض الكلى المزمن؟

هو وجود تلف أو مشكلة مستمرة في الكلى تؤثر في قدرتها على أداء وظائفها. تساعد الكلى على تصفية الدم والتخلص من الفضلات والسوائل الزائدة، وقد تتأثر هذه الوظائف مع تقدم المرض.

## من يحتاج إلى الاهتمام بالفحص؟

تزداد أهمية المتابعة لدى المصابين بالسكري أو ارتفاع ضغط الدم أو أمراض القلب، وكذلك من لديهم تاريخ عائلي للفشل الكلوي. يحدد الطبيب الفحوصات المناسبة وتكرارها بحسب الحالة.

## كيف يتم التقييم؟

يعتمد التقييم على فحوصات الدم والبول، وليس على الأعراض وحدها. تساعد النتائج الطبيب على معرفة قدرة الكلى على التصفية ووجود مؤشرات على التلف.

غياب الألم لا يستبعد المرض، كما أن ظهور نتيجة غير طبيعية يحتاج إلى تفسير طبي ومتابعة، وليس إلى تشخيص ذاتي.

## الخطوة التالية

إذا كانت لديك عوامل خطر أو نتائج سابقة غير طبيعية، تواصل مع العيادة لتحديد موعد ومناقشة فحوصاتك مع الدكتور طارق أبو حويج.`,
      en: `Kidney disease can begin without clear symptoms. Feeling fine on its own is therefore not enough to judge the health of the kidneys, especially when risk factors call for follow-up.

## What is chronic kidney disease?

It is lasting damage or a persistent problem in the kidneys that affects their ability to perform their functions. The kidneys help filter the blood and remove waste and excess fluid, and these functions can decline as the disease progresses.

## Who should pay attention to testing?

Follow-up matters most for people living with diabetes, high blood pressure or heart disease, as well as those with a family history of kidney failure. The doctor decides which tests are appropriate and how often to repeat them based on the individual case.

## How is it assessed?

The assessment relies on blood and urine tests, not on symptoms alone. The results help the doctor understand how well the kidneys filter and whether there are signs of damage.

The absence of pain does not rule out disease, and an abnormal result needs medical interpretation and follow-up rather than self-diagnosis.

## The next step

If you have risk factors or earlier abnormal results, contact the clinic to arrange an appointment and discuss your tests with Dr Tariq Abu Hweij.`,
    },
    related: ["kidney-function-tests", "blood-pressure-kidney-health", "albumin-in-urine"],
  },
  {
    slug: "kidney-function-tests",
    category: "guides",
    title: {
      ar: "فحوصات وظائف الكلى: ما الفرق بين الكرياتينين وeGFR وزلال البول؟",
      en: "Kidney Function Tests: Creatinine, eGFR and Urine Albumin Explained",
    },
    excerpt: {
      ar: "قد يحتوي تقرير المختبر على عدة أرقام تخص الكلى. تعرّف على دور كل فحص، ولماذا لا يجعل رقم واحد وحده أساسًا للتشخيص.",
      en: "A lab report may contain several kidney-related numbers. Learn what each test measures and why no single value is enough for a diagnosis.",
    },
    seo: {
      title: {
        ar: "فحوصات وظائف الكلى: الكرياتينين وeGFR وزلال البول",
        en: "Kidney Function Tests: Creatinine, eGFR and Urine Albumin",
      },
      description: {
        ar: "شرح مبسّط لفحوصات وظائف الكلى: معنى الكرياتينين، ومعدل الترشيح الكبيبي eGFR، وأهمية زلال البول، وكيف تستعد للزيارة.",
        en: "A clear explanation of kidney function tests: creatinine, eGFR, urine albumin, and how to prepare for your appointment.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis",
    body: {
      ar: `قد يحتوي تقرير المختبر على عدة أرقام تخص الكلى. فهم دور كل فحص يساعدك على مناقشة النتائج مع الطبيب، لكنه لا يجعل رقمًا واحدًا كافيًا للتشخيص.

## الكرياتينين وeGFR

الكرياتينين مادة ناتجة عن نشاط العضلات وتتخلص منها الكلى. تُستخدم نتيجة فحصه، مع معلومات أخرى، لتقدير معدل الترشيح الكبيبي المعروف باسم eGFR.

يساعد هذا التقدير في تقييم قدرة الكلى على تصفية الدم. ينظر الطبيب إلى النتيجة ضمن سياق الحالة الصحية والنتائج السابقة.

## لماذا نحتاج إلى فحص البول؟

قد يكشف فحص البول عن الألبومين، وهو بروتين قد يتسرب إلى البول عندما تتضرر الكلى. لذلك، فحص الدم وفحص البول يقدمان معلومات مختلفة ومتكاملة.

## هل نتيجة واحدة تكفي؟

قد تحتاج النتائج غير الطبيعية إلى إعادة الفحص أو متابعة إضافية. كما تُستخدم الفحوصات لمراقبة الحالة مع الوقت وتقييم خطة العلاج.

## كيف تستعد للزيارة؟

أحضر تقاريرك السابقة وقائمة الأدوية التي تستخدمها. لا توقف أي دواء من نفسك قبل الفحص.

لفهم نتائج وظائف الكلى في سياق حالتك، تواصل مع العيادة لتحديد موعد.`,
      en: `A lab report may contain several kidney-related numbers. Understanding what each test measures helps you discuss the results with your doctor, but no single number is enough for a diagnosis.

## Creatinine and eGFR

Creatinine is a waste product of muscle activity that the kidneys remove from the blood. Its result, together with other information, is used to estimate the glomerular filtration rate, known as eGFR.

This estimate helps assess how well the kidneys filter the blood. The doctor reads it in the context of your overall health and previous results.

## Why is a urine test needed?

A urine test can reveal albumin, a protein that may leak into the urine when the kidneys are damaged. Blood tests and urine tests therefore provide different, complementary information.

## Is one result enough?

Abnormal results may need to be repeated or followed up with additional testing. The tests are also used to monitor the condition over time and to review the treatment plan.

## How to prepare for your visit

Bring your previous reports and a list of the medicines you take. Do not stop any medicine on your own before the test.

To understand your kidney function results in the context of your health, contact the clinic to arrange an appointment.`,
    },
    related: ["chronic-kidney-disease", "albumin-in-urine", "diabetes-kidney-health"],
  },
  {
    slug: "blood-pressure-kidney-health",
    category: "guides",
    title: {
      ar: "ارتفاع ضغط الدم والكلى: علاقة تحتاج إلى متابعة منتظمة",
      en: "Blood Pressure and the Kidneys: A Relationship Worth Monitoring",
    },
    excerpt: {
      ar: "قد لا يسبب ارتفاع ضغط الدم أعراضًا واضحة، لكنه قد يؤثر في الكلى مع الوقت. تعرّف على طبيعة العلاقة بينهما وما يشمله التقييم.",
      en: "High blood pressure often has no clear symptoms, yet it can affect the kidneys over time. Learn how the two interact and what assessment involves.",
    },
    seo: {
      title: {
        ar: "ارتفاع ضغط الدم والكلى: العلاقة والمتابعة المنتظمة",
        en: "Blood Pressure and the Kidneys: The Link and Regular Monitoring",
      },
      description: {
        ar: "كيف يؤثر ارتفاع ضغط الدم في الكلى، ولماذا لا يُعتمد على الأعراض، وما يشمله تقييم الحالة مع الدكتور طارق أبو حويج.",
        en: "How high blood pressure affects the kidneys, why symptoms are not a reliable guide, and what an assessment involves.",
      },
    },
    sourceUrl: "https://www.niddk.nih.gov/health-information/kidney-disease/high-blood-pressure",
    body: {
      ar: `قد لا يسبب ارتفاع ضغط الدم أعراضًا واضحة، لكنه قد يؤثر في الكلى مع الوقت. والعلاقة بين الضغط والكلى متبادلة، لذلك من المفيد متابعتهما معًا.

## كيف يؤثر الضغط في الكلى؟

قد يؤدي ارتفاع الضغط إلى إتلاف الأوعية الدموية التي تساعد الكلى على أداء وظائفها. وعندما تتأثر الكلى، قد تصبح قدرتها على التخلص من السوائل الزائدة أقل، ما قد يزيد صعوبة ضبط الضغط.

## لماذا لا نعتمد على الأعراض؟

غياب الصداع أو الدوخة لا يعني أن ضغط الدم طبيعي. القياس والمتابعة أكثر فائدة من الاعتماد على الشعور العام وحده.

## ما الذي يشمله التقييم؟

قد يشمل تقييم الحالة قياسات الضغط وفحوصات وظائف الكلى والبول، مع مراجعة الأدوية والتاريخ الصحي.

الالتزام بالعلاج الموصوف ومناقشة نمط الغذاء والنشاط مع الطبيب جزء من المتابعة. أهداف الضغط وخطة العلاج تختلف بحسب الحالة؛ لا تعدّل الجرعات بنفسك.

## متى تتواصل مع العيادة؟

إذا كنت تعاني من ارتفاع الضغط أو لديك نتائج غير طبيعية لوظائف الكلى، تواصل مع العيادة لمناقشة خطة المتابعة المناسبة.`,
      en: `High blood pressure often causes no clear symptoms, yet it can affect the kidneys over time. The relationship works in both directions, so monitoring them together is useful.

## How does blood pressure affect the kidneys?

Raised blood pressure can damage the blood vessels that help the kidneys do their work. When the kidneys are affected, their ability to remove excess fluid may fall, which can make blood pressure harder to control.

## Why not rely on symptoms?

The absence of headache or dizziness does not mean blood pressure is normal. Measuring and follow-up are more useful than relying on how you feel.

## What does the assessment involve?

An assessment may include blood pressure readings, blood and urine kidney tests, and a review of your medicines and medical history.

Sticking to the prescribed treatment and discussing diet and activity with your doctor are part of the follow-up. Blood pressure targets and treatment plans differ from person to person; do not adjust doses on your own.

## When to contact the clinic

If you have high blood pressure or abnormal kidney function results, contact the clinic to discuss an appropriate follow-up plan.`,
    },
    related: ["chronic-kidney-disease", "home-blood-pressure-monitoring", "kidney-function-tests"],
  },
  {
    slug: "diabetes-kidney-health",
    category: "guides",
    title: {
      ar: "السكري والكلى: لماذا تبقى الفحوصات مهمة حتى عندما تشعر أنك بخير؟",
      en: "Diabetes and the Kidneys: Why Testing Still Matters When You Feel Well",
    },
    excerpt: {
      ar: "متابعة السكري الجيدة تشمل صحة الكلى، وليس قياسات السكر فقط. تعرّف على كيفية متابعة وظائف الكلى وما الذي يساعد على حمايتها.",
      en: "Good diabetes care includes kidney health, not just sugar readings. Learn how kidney function is monitored and what helps protect it.",
    },
    seo: {
      title: {
        ar: "السكري والكلى: أهمية الفحوصات الدورية",
        en: "Diabetes and the Kidneys: Why Regular Testing Matters",
      },
      description: {
        ar: "كيف يؤثر السكري على الكلى، وما الفحوصات التي يستخدمها الطبيب للمتابعة، وما الذي يساعد على حماية الكلى مع الوقت.",
        en: "How diabetes affects the kidneys, which tests are used for follow-up, and what helps protect the kidneys over time.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/diabetic-kidney-disease",
    body: {
      ar: `المتابعة الجيدة للسكري تشمل الاهتمام بصحة الكلى، وليس بقياسات السكر فقط. فقد يتطور تأثير السكري على الكلى تدريجيًا ومن دون أعراض واضحة في البداية.

## كيف يؤثر السكري في الكلى؟

قد يسبب ارتفاع سكر الدم مع الوقت تلفًا في الأوعية الدموية داخل الكلى. كما قد يترافق السكري مع ارتفاع ضغط الدم، وهو عامل آخر يؤثر في صحة الكلى.

## كيف نتابع صحة الكلى؟

يستخدم الطبيب فحوصات الدم والبول لتقييم وظائف الكلى ووجود الألبومين في البول. يُحدد جدول المتابعة بحسب نوع السكري والحالة الصحية والنتائج السابقة.

## ما الذي يساعد على حماية الكلى؟

تشمل المتابعة ضبط السكر والضغط وفق الخطة الطبية، والالتزام بالأدوية، ومناقشة الغذاء والنشاط والتدخين مع الفريق المعالج.

لا يعني وجود السكري أن كل شخص سيصاب بفشل كلوي، كما أن وجود مشكلة في الكلى لا يُقيّم من تحليل واحد بمعزل عن بقية المعلومات.

## قبل موعدك

أحضر نتائج السكر ووظائف الكلى وقائمة الأدوية. تواصل مع العيادة لتحديد موعد إذا كنت تحتاج إلى مراجعة خطة متابعة الكلى.`,
      en: `Good diabetes care includes attention to kidney health, not just blood sugar readings. The effect of diabetes on the kidneys can develop gradually, often without clear symptoms at first.

## How does diabetes affect the kidneys?

Raised blood sugar can, over time, damage the small blood vessels inside the kidneys. Diabetes also often occurs together with high blood pressure, another factor that affects kidney health.

## How is kidney health monitored?

The doctor uses blood and urine tests to assess kidney function and check for albumin in the urine. The follow-up schedule depends on the type of diabetes, your general health and previous results.

## What helps protect the kidneys?

Follow-up includes keeping sugar and blood pressure on track according to the medical plan, taking medicines as prescribed, and discussing diet, activity and smoking with the care team.

Having diabetes does not mean everyone will develop kidney failure, and a kidney problem cannot be judged from a single test in isolation from the rest of your information.

## Before your appointment

Bring your blood sugar and kidney function results and a list of your medicines. Contact the clinic to arrange an appointment if you need your kidney follow-up plan reviewed.`,
    },
    related: ["kidney-function-tests", "blood-pressure-kidney-health", "chronic-kidney-disease"],
  },
];

export function withClosing(article) {
  return {
    ...article,
    body: {
      ar: article.body.ar + closing("ar", article.related),
      en: article.body.en + closing("en", article.related),
    },
  };
}
