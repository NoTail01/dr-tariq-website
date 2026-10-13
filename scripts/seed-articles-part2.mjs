/**
 * Seed content part 2: articles 6–10.
 * See `seed-articles-part1.mjs` for structure and rules.
 */

const RELATED_TITLES = {
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

function closing(locale, slugs) {
  const base = locale === "ar" ? "/ar/blog" : "/en/blog";
  const bookHref = locale === "ar" ? "/ar/book" : "/en/book";
  const items = slugs.map((slug) => `- [${RELATED_TITLES[locale][slug]}](${base}/${slug})`).join("\n");
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

export { closing as closingBlock };

export const SEED_ARTICLES_PART2 = [
  {
    slug: "albumin-in-urine",
    category: "guides",
    title: {
      ar: "الزلال في البول: ماذا يعني وجود الألبومين وكيف تتم متابعته؟",
      en: "Albumin in the Urine: What It Means and How It Is Followed Up",
    },
    excerpt: {
      ar: "ظهور كلمة «زلال» في تقرير البول يحتاج إلى تفسير ضمن الحالة الصحية. تعرّف على معنى الألبومين، وكيف يُقاس، ولماذا يُكرر الفحص.",
      en: "The word albumin on a urine report needs interpretation in the context of your health. Learn what it means, how it is measured, and why the test is repeated.",
    },
    seo: {
      title: {
        ar: "الزلال في البول: معناه وطرق المتابعة",
        en: "Albumin in the Urine: Meaning and Follow-up",
      },
      description: {
        ar: "ما هو الألبومين، وكيف يُقاس زلال البول، ولماذا يحتاج الفحص إلى التكرار والمتابعة مع الدكتور طارق أبو حويج.",
        en: "What albumin is, how urine albumin is measured, and why the test needs repeating and follow-up.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis/albuminuria-albumin-urine",
    body: {
      ar: `ظهور كلمة «زلال» في تقرير البول قد يثير القلق، لكنه يحتاج إلى تفسير ضمن الحالة الصحية، وليس إلى استنتاج أن المريض يعاني من فشل كلوي.

## ما هو الألبومين؟

الألبومين بروتين موجود في الدم. تعمل الكلى السليمة عادة على منع مرور كميات كبيرة منه إلى البول. وقد يكون ارتفاعه في البول مؤشرًا على تلف الكلى.

## كيف يتم فحصه؟

قد يستخدم الطبيب فحصًا أوليًا للبول، ثم قياس نسبة الألبومين إلى الكرياتينين المعروفة باسم UACR. تساعد هذه النسبة على تقييم كمية الألبومين بصورة أكثر فائدة.

## هل يحتاج الفحص إلى التكرار؟

قد يطلب الطبيب إعادة التحليل لتأكيد النتيجة ومتابعتها. ويجمعها مع فحوصات وظائف الكلى وقياسات الضغط والتاريخ الصحي.

تزداد أهمية المتابعة عند وجود السكري أو ارتفاع الضغط أو عوامل خطر أخرى.

## ما الخطوة المناسبة؟

أحضر تقرير التحليل والنتائج السابقة إلى الزيارة، ولا تبدأ علاجًا أو حمية شديدة من نفسك. تواصل مع العيادة لتحديد موعد لتقييم النتيجة.`,
      en: `Seeing the word albumin on a urine report can be worrying, but it needs interpretation in the context of your health — it is not, on its own, proof of kidney failure.

## What is albumin?

Albumin is a protein found in the blood. Healthy kidneys normally keep large amounts of it out of the urine. A raised level in the urine can be a sign of kidney damage.

## How is it measured?

The doctor may start with a urine dipstick test, then measure the albumin-to-creatinine ratio, known as UACR. This ratio gives a more useful picture of the amount of albumin.

## Does the test need repeating?

The doctor may ask for the analysis to be repeated to confirm and follow up the result. It is interpreted together with kidney function tests, blood pressure readings and your medical history.

Follow-up becomes more important when diabetes, high blood pressure or other risk factors are present.

## What is the right next step?

Bring the lab report and your previous results to the visit, and do not start a treatment or a strict diet on your own. Contact the clinic to arrange an appointment to have the result assessed.`,
    },
    related: ["kidney-function-tests", "chronic-kidney-disease", "diabetes-kidney-health"],
  },
  {
    slug: "kidney-stone-symptoms",
    category: "guides",
    title: {
      ar: "أعراض حصى الكلى: متى يحتاج الألم إلى تقييم عاجل؟",
      en: "Kidney Stone Symptoms: When Pain Needs Urgent Assessment",
    },
    excerpt: {
      ar: "قد تسبب حصى الكلى ألمًا حادًا في الخاصرة أو الظهر. تعرّف على الأعراض الممكنة، والحالات التي تستدعي رعاية سريعة، ولماذا لا يكفي شرب الماء وحده.",
      en: "Kidney stones can cause severe pain in the flank or back. Learn the possible symptoms, when urgent care is needed, and why water alone is not enough.",
    },
    seo: {
      title: {
        ar: "أعراض حصى الكلى ومتى تحتاج إلى رعاية عاجلة",
        en: "Kidney Stone Symptoms and When to Seek Urgent Care",
      },
      description: {
        ar: "أعراض حصى الكلى الممكنة، والعلامات التي تستدعي تقييمًا طبيًا سريعًا، ولماذا لا يُفترض أن كل الحصى تخرج وحدها.",
        en: "Possible kidney stone symptoms, the signs that need urgent medical assessment, and why passing a stone cannot be assumed.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/symptoms-causes",
    body: {
      ar: `قد تسبب حصى الكلى ألمًا حادًا في الخاصرة أو الظهر أو أسفل البطن، وقد يأتي الألم على شكل موجات. لكن هذه الأعراض لا تثبت وجود حصاة؛ فقد ترتبط بمشكلات أخرى تحتاج إلى التقييم.

## ما الأعراض الممكنة؟

قد تشمل الأعراض وجود دم في البول، أو ألم أثناء التبول، أو الحاجة المتكررة إليه. وقد يترافق الألم مع الغثيان أو القيء.

قد تظهر أيضًا صعوبة في التبول أو خروج كمية قليلة منه، أو تغير في رائحة البول ومظهره.

## متى تطلب الرعاية سريعًا؟

الألم الشديد، أو الدم في البول، أو عدم القدرة على التبول يستدعي تقييمًا طبيًا سريعًا. وتزداد أهمية ذلك عند وجود حرارة أو قشعريرة أو قيء.

لا تنتظر ردًا عبر واتساب عند وجود أعراض تستدعي رعاية عاجلة.

## هل شرب الماء يكفي؟

لا يمكن افتراض أن جميع الحصى ستخرج وحدها أو أن زيادة الماء مناسبة لكل حالة. يحتاج الطبيب إلى تقييم الحالة وتحديد الخطوة المناسبة.

بعد التعامل مع الأعراض العاجلة، يمكن التواصل مع العيادة لمتابعة صحة الكلى ومناقشة الوقاية.`,
      en: `Kidney stones can cause severe pain in the flank, back or lower abdomen, and the pain may come in waves. These symptoms do not prove a stone is present; other problems that need assessment can look the same.

## What are the possible symptoms?

Symptoms may include blood in the urine, pain while passing urine, or needing to urinate more often. Pain may also come with nausea or vomiting.

You may also notice difficulty passing urine or only small amounts coming out, or a change in the smell and appearance of the urine.

## When should you seek care quickly?

Severe pain, blood in the urine, or being unable to pass urine all call for prompt medical assessment. This becomes more important when there is fever, chills or vomiting.

Do not wait for a WhatsApp reply when symptoms call for urgent care.

## Is drinking water enough?

It cannot be assumed that all stones will pass on their own, or that drinking more water is appropriate for every case. The doctor needs to assess the situation and decide the right step.

After any urgent symptoms are dealt with, you can contact the clinic for kidney follow-up and to discuss prevention.`,
    },
    related: ["preventing-kidney-stones", "acute-kidney-injury", "kidney-function-tests"],
  },
  {
    slug: "preventing-kidney-stones",
    category: "guides",
    title: {
      ar: "الوقاية من تكرار حصى الكلى: هل توجد حمية واحدة للجميع؟",
      en: "Preventing Recurrent Kidney Stones: Is There One Diet for Everyone?",
    },
    excerpt: {
      ar: "بعد الإصابة بحصى الكلى، تعتمد الوقاية على نوع الحصاة والحالة الصحية. تعرّف على دور السوائل والغذاء، ولماذا لا توجد قائمة موحدة للجميع.",
      en: "After a kidney stone, prevention depends on the type of stone and your health. Learn about fluids and diet, and why there is no single list for everyone.",
    },
    seo: {
      title: {
        ar: "الوقاية من تكرار حصى الكلى: السوائل والغذاء",
        en: "Preventing Recurrent Kidney Stones: Fluids and Diet",
      },
      description: {
        ar: "كيف يقلل الماء احتمال تكرار حصى الكلى، ولماذا تختلف التوصيات الغذائية بحسب نوع الحصاة، وما الذي يحضره للموعد.",
        en: "How fluid intake can lower the chance of recurrent kidney stones, why diet advice differs by stone type, and what to bring to your appointment.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/eating-diet-nutrition",
    body: {
      ar: `بعد الإصابة بحصى الكلى، يصبح السؤال المهم: كيف نقلل احتمال تكرارها؟ الإجابة تعتمد على نوع الحصاة والحالة الصحية، وليست قائمة ممنوعات موحدة لكل شخص.

## السوائل جزء مهم من الوقاية

يساعد تناول كمية مناسبة من السوائل على الوقاية من الحصى لدى كثير من الأشخاص. لكن الكمية المناسبة تختلف، خصوصًا عند وجود فشل كلوي أو تعليمات بتقييد السوائل.

لا تزد كمية الماء بصورة كبيرة إذا كانت لديك تعليمات طبية مختلفة.

## نوع الحصاة يوجه الغذاء

قد تختلف التوصيات المتعلقة بالصوديوم والبروتين الحيواني والكالسيوم والأوكسالات بحسب نوع الحصاة. لذلك، لا يُنصح بحذف مجموعات غذائية كاملة بصورة عشوائية.

يمكن للطبيب أو اختصاصي التغذية المساعدة في وضع خطة تتناسب مع نتائجك.

## ماذا تحضر للموعد؟

أحضر تقارير الحصى وأي تحليل لتركيبها، وقائمة الأدوية والمكملات. هذه المعلومات تساعد على وضع خطة أوضح للوقاية.

تواصل مع العيادة لتحديد موعد لمناقشة أسباب تكرار الحصى وخطوات المتابعة المناسبة.`,
      en: `After having a kidney stone, the important question becomes: how do we lower the chance of it happening again? The answer depends on the type of stone and your overall health, not on a single list of prohibitions that suits everyone.

## Fluids are an important part of prevention

Drinking an adequate amount of fluid helps prevent stones in many people. The right amount varies, especially if there is kidney failure or medical instructions to restrict fluids.

Do not greatly increase your water intake if you have been given different medical instructions.

## The type of stone guides the diet

Advice about sodium, animal protein, calcium and oxalates can differ depending on the type of stone. For that reason, cutting out whole food groups at random is not advisable.

Your doctor or a dietitian can help build a plan that fits your results.

## What to bring to your appointment

Bring any stone reports and analysis of its composition, along with a list of medicines and supplements. This information helps build a clearer prevention plan.

Contact the clinic to arrange an appointment to discuss the causes of recurrent stones and the right follow-up steps.`,
    },
    related: ["kidney-stone-symptoms", "chronic-kidney-disease", "diabetes-kidney-health"],
  },
  {
    slug: "acute-kidney-injury",
    category: "guides",
    title: {
      ar: "إصابة الكلى الحادة: لماذا يحتاج التغير المفاجئ في وظائف الكلى إلى الاهتمام؟",
      en: "Acute Kidney Injury: Why a Sudden Change Needs Attention",
    },
    excerpt: {
      ar: "إصابة الكلى الحادة تعني تدهورًا مفاجئًا في وظائف الكلى، وتختلف عن المرض المزمن. تعرّف على الأسباب، والعلامات، ومتى تكون المراجعة عاجلة.",
      en: "Acute kidney injury means a sudden decline in kidney function and differs from chronic disease. Learn the causes, signs, and when review is urgent.",
    },
    seo: {
      title: {
        ar: "إصابة الكلى الحادة: الأسباب والعلامات",
        en: "Acute Kidney Injury: Causes and Warning Signs",
      },
      description: {
        ar: "ما هي إصابة الكلى الحادة، وكيف تختلف عن المرض المزمن، وما الأسباب الممكنة، ومتى تحتاج إلى رعاية عاجلة.",
        en: "What acute kidney injury is, how it differs from chronic kidney disease, its possible causes, and when urgent care is needed.",
      },
    },
    sourceUrl: "https://www.nhs.uk/conditions/acute-kidney-injury/",
    body: {
      ar: `إصابة الكلى الحادة تعني تدهورًا مفاجئًا في قدرتها على العمل. تختلف عن المرض المزمن الذي يستمر مع الوقت، وقد تحدث أثناء مرض آخر أو بعد ظروف تؤثر في تدفق الدم أو تصريف البول.

## ما الأسباب الممكنة؟

قد ترتبط بالجفاف الشديد، أو العدوى، أو انخفاض الضغط، أو انسداد المسالك البولية. وقد تدخل بعض الأدوية أو الإجراءات ضمن عوامل الخطر بحسب الحالة.

هذا لا يعني إيقاف الأدوية من نفسك؛ مراجعتها تكون مع الطبيب.

## هل تظهر أعراض دائمًا؟

قد تكون الإصابة خفيفة دون أعراض واضحة. وقد يظهر انخفاض كمية البول، أو تورم، أو غثيان، أو تعب، أو ضيق نفس، أو ارتباك.

## كيف يتم اكتشافها؟

يعتمد التقييم على فحوصات الدم، ومنها الكرياتينين، مع مراجعة كمية البول والحالة الصحية. وقد تُطلب فحوصات إضافية بحسب السبب المتوقع.

## متى تكون المراجعة عاجلة؟

عند حدوث نقص ملحوظ في البول أو ضيق نفس أو ارتباك، اطلب تقييمًا عاجلًا. لا تنتظر موعدًا روتينيًا أو رسالة واتساب.`,
      en: `Acute kidney injury means a sudden decline in the kidneys' ability to work. It differs from chronic kidney disease, which persists over time, and can occur during another illness or after conditions that affect blood flow or urine drainage.

## What are the possible causes?

It may be linked to severe dehydration, infection, low blood pressure, or a blockage in the urinary tract. Some medicines or procedures can be among the risk factors depending on the case.

This does not mean stopping medicines on your own; any review of them is done with your doctor.

## Do symptoms always appear?

The injury can be mild with no clear symptoms. You may notice reduced urine output, swelling, nausea, tiredness, shortness of breath or confusion.

## How is it detected?

Assessment relies on blood tests, including creatinine, together with a review of urine output and your general health. Additional tests may be ordered depending on the suspected cause.

## When is the review urgent?

If you notice a marked drop in urine output, shortness of breath or confusion, seek urgent medical assessment. Do not wait for a routine appointment or a WhatsApp message.`,
    },
    related: ["chronic-kidney-disease", "kidney-function-tests", "kidney-stone-symptoms"],
  },
  {
    slug: "home-blood-pressure-monitoring",
    category: "guides",
    title: {
      ar: "قياس ضغط الدم في المنزل: كيف تجعل القراءات أكثر فائدة للطبيب؟",
      en: "Home Blood Pressure Monitoring: Making Readings Useful for Your Doctor",
    },
    excerpt: {
      ar: "قد تساعد قياسات ضغط الدم المنزلية في متابعة حالتك، بشرط استخدام الجهاز بالطريقة الصحيحة وتسجيل القراءات بوضوح.",
      en: "Home blood pressure readings can support your follow-up, provided the device is used correctly and readings are recorded clearly.",
    },
    seo: {
      title: {
        ar: "قياس ضغط الدم في المنزل: خطوات عملية",
        en: "Home Blood Pressure Monitoring: Practical Steps",
      },
      description: {
        ar: "كيف تقيس ضغط الدم في المنزل بالطريقة الصحيحة، ولماذا تسجل النتائج، ولماذا لا يغني قياس واحد عن مراجعة الطبيب.",
        en: "How to measure blood pressure correctly at home, why recording readings matters, and why one reading is no substitute for a medical review.",
      },
    },
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/blood-pressure-test/",
    body: {
      ar: `قد تساعد قياسات ضغط الدم المنزلية الطبيب على متابعة حالتك، بشرط استخدام الجهاز بالطريقة الصحيحة وتسجيل القراءات بوضوح.

## استخدم الجهاز وفق التعليمات

الأجهزة قد تختلف، لذلك اتبع دليل الجهاز، واطلب من الطبيب أو الممرض توضيح طريقة الاستخدام ومقاس الكفة المناسب.

عند القياس، اجلس وأرح ذراعك على سطح مناسب، وحافظ على وضع مريح وثابت أثناء عمل الجهاز.

## سجل النتائج بدل الاعتماد على الذاكرة

دوّن القراءة ووقت القياس، وأحضر السجل إلى موعدك. اتبع جدول القياس الذي يحدده الطبيب، فقد تحتاج إلى أكثر من قراءة لتقييم الوضع بصورة مناسبة.

## هل قراءة واحدة تعني تغيير العلاج؟

لا تعدّل الدواء اعتمادًا على قراءة منفردة. ناقش النتائج مع الطبيب، خصوصًا إذا كانت تختلف كثيرًا عن المعتاد.

ارتفاع الضغط قد يكون دون أعراض، لذلك لا تعتمد على الصداع أو الشعور العام لمعرفة مستواه.

تواصل مع العيادة لتحديد موعد لمراجعة سجل الضغط وخطة المتابعة، واطلب رعاية عاجلة عند ظهور أعراض شديدة.`,
      en: `Home blood pressure readings can help your doctor follow your condition, provided the device is used correctly and the readings are recorded clearly.

## Use the device according to its instructions

Devices differ, so follow the device manual and ask the doctor or nurse to explain how to use it and which cuff size is right for you.

When measuring, sit down and rest your arm on a suitable surface, keeping a comfortable, still position while the device works.

## Record the results instead of relying on memory

Write down each reading and the time it was taken, and bring the log to your appointment. Follow the measuring schedule your doctor sets; more than one reading may be needed to assess the situation properly.

## Does one reading mean treatment should change?

Do not adjust your medicine based on a single reading. Discuss the results with your doctor, especially if they differ a lot from usual.

High blood pressure can occur without symptoms, so do not rely on headache or how you feel to judge the level.

Contact the clinic to arrange an appointment to review your blood pressure log and follow-up plan, and seek urgent care if severe symptoms appear.`,
    },
    related: ["blood-pressure-kidney-health", "chronic-kidney-disease", "kidney-function-tests"],
  },
  {
    slug: "kidney-transplant-follow-up",
    category: "guides",
    title: {
      ar: "زراعة الكلى: لماذا تستمر المتابعة الطبية بعد العملية؟",
      en: "Kidney Transplantation: Why Medical Follow-up Continues Afterwards",
    },
    excerpt: {
      ar: "زراعة الكلى أحد الخيارات العلاجية لبعض المصابين بالفشل الكلوي، لكنها ليست نهاية المتابعة. تعرّف على ما يحتاج المريض لمعرفته.",
      en: "Kidney transplantation is one treatment option for some people with kidney failure, but it is not the end of follow-up. Learn what patients need to know.",
    },
    seo: {
      title: {
        ar: "زراعة الكلى: التقييم والمتابعة بعد العملية",
        en: "Kidney Transplantation: Assessment and Follow-up Afterwards",
      },
      description: {
        ar: "ما هي زراعة الكلى، ولماذا تستمر المتابعة بعد العملية، وكيف تُراقب وظائف الكلية المزروعة، ودور العيادة في متابعة أمراض الكلى.",
        en: "What kidney transplantation involves, why follow-up continues afterwards, how the transplanted kidney is monitored, and the clinic's role in kidney follow-up.",
      },
    },
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/kidney-transplant",
    body: {
      ar: `زراعة الكلى أحد الخيارات العلاجية لبعض المصابين بالفشل الكلوي. تُنقل خلالها كلية من متبرع إلى جسم المريض لتقوم بوظائف التصفية، بعد تقييم متخصص لمدى ملاءمة الزراعة.

## هل الزراعة تنهي الحاجة إلى العلاج؟

الزراعة علاج للفشل الكلوي، لكنها ليست نهاية المتابعة. يحتاج المريض إلى أدوية تساعد على منع رفض الكلية، وزيارات وفحوصات منتظمة.

## لماذا تُراقب وظائف الكلية المزروعة؟

تساعد المتابعة على تقييم عمل الكلية ومراجعة الأدوية واكتشاف المشكلات المحتملة، ومنها العدوى أو الرفض أو التأثيرات الجانبية للعلاج.

لا توقف أدوية منع الرفض أو تغير جرعاتها دون الرجوع إلى فريق الزراعة.

## ماذا تفعل عند تغير حالتك؟

اتبع تعليمات فريق الزراعة بشأن الأعراض التي تستدعي التواصل العاجل، ولا تؤجل المراجعة عند وجود تغير مقلق.

## دور المتابعة في العيادة

يمكن الاستفسار عن متابعة أمراض الكلى لدى الدكتور طارق أبو حويج. هذا النص لا يعني إجراء عمليات الزراعة داخل العيادة؛ العملية والتقييم المرتبط بها يتمان ضمن فريق ومركز متخصصين.`,
      en: `Kidney transplantation is one of the treatment options for some people with kidney failure. A kidney from a donor is transferred into the patient's body to carry out the filtering work, after a specialist assessment of whether transplantation is suitable.

## Does transplantation end the need for treatment?

Transplantation is a treatment for kidney failure, but it is not the end of follow-up. Patients need medicines that help prevent rejection of the kidney, along with regular visits and tests.

## Why is the transplanted kidney monitored?

Follow-up helps assess how the kidney is working, review medicines, and detect possible problems, including infection, rejection or side effects of treatment.

Do not stop anti-rejection medicines or change their doses without consulting the transplant team.

## What should you do if your condition changes?

Follow the transplant team's instructions about symptoms that need urgent contact, and do not postpone a review when something concerning changes.

## The clinic's role in follow-up

Enquiries about kidney follow-up with Dr Tariq Abu Hweij are welcome. This article does not mean transplant operations are carried out at the clinic; the procedure and its assessment take place within a specialist team and centre.`,
    },
    related: ["chronic-kidney-disease", "kidney-function-tests", "blood-pressure-kidney-health"],
  },
];

export function withClosing2(article, closingFn) {
  return {
    ...article,
    body: {
      ar: article.body.ar + closingFn("ar", article.related),
      en: article.body.en + closingFn("en", article.related),
    },
  };
}
