document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    const resultPlaceholder = document.getElementById('resultPlaceholder');
    const resultContent = document.getElementById('resultContent');
    const riskScoreVal = document.getElementById('riskScoreVal');
    const currentSmoker = document.getElementById('currentSmoker');
    const cigsPerDay = document.getElementById('cigsPerDay');
    
    // Toggle Cigarettes / Day Field
    window.toggleCigs = function() {
        if (currentSmoker.value === '1') {
            cigsPerDay.disabled = false;
            cigsPerDay.required = true;
        } else {
            cigsPerDay.disabled = true;
            cigsPerDay.required = false;
            cigsPerDay.value = '';
        }
    };

    // Calculate simulated risk purely for frontend demonstration
    function calculateSimulatedRisk() {
        let risk = 5.0; // Base risk
        
        const age = parseInt(document.getElementById('age').value || 30);
        const sysBP = parseInt(document.getElementById('sysBP').value || 120);
        const bmi = parseFloat(document.getElementById('bmi').value || 25);
        const isSmoker = document.getElementById('currentSmoker').value === '1';
        
        // Age factor
        if (age > 40) risk += (age - 40) * 0.5;
        // BP factor
        if (sysBP > 120) risk += (sysBP - 120) * 0.2;
        // BMI factor
        if (bmi > 25) risk += (bmi - 25) * 0.3;
        // Smoking factor
        if (isSmoker) risk += 10;
        
        // Cap
        if (risk > 99) risk = 99.9;
        if (risk < 1) risk = 1.0;
        
        return risk.toFixed(1);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btnGenerate = document.getElementById('btnGenerate');
        const btnText = btnGenerate.querySelector('.btn-text');
        const spinner = btnGenerate.querySelector('.spinner');
        
        // Simple loading state
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        btnGenerate.disabled = true;
        
        setTimeout(() => {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            btnGenerate.disabled = false;
            
            const risk = calculateSimulatedRisk();
            updateResultUI(risk);
        }, 800);
    });

    let currentLang = 'en';
    let lastRiskObj = null;

    function updateResultUI(risk, skipAnimation = false) {
        lastRiskObj = { risk };
        const val = parseFloat(risk);
        
        const dict = i18n[currentLang] || i18n['en'];
        
        let riskCategory = "Low";
        let summary = "Your 10-year risk of developing cardiovascular disease is currently classified as <strong>Low</strong>.";
        let badgeClass = "low";

        if (val >= 10 && val < 20) {
            riskCategory = "Moderate";
            summary = "Your 10-year risk is classified as <strong>Moderate</strong>. Consider discussing preventive lifestyle changes with your doctor.";
            badgeClass = "medium";
        } else if (val >= 20) {
            riskCategory = "High";
            summary = "Your 10-year risk is classified as <strong>High</strong>. It is strongly recommended to consult a healthcare professional for a medical evaluation.";
            badgeClass = "high";
        }

        document.getElementById('riskScoreVal').innerText = risk;
        const badge = document.getElementById('riskLevelBadge');
        badge.innerText = `${riskCategory} Risk`;
        badge.className = `badge ${badgeClass}`;
        document.getElementById('resultSummary').innerHTML = summary;

        resultPlaceholder.style.display = 'none';
        resultContent.classList.remove('hidden');
        
        if (!skipAnimation) {
            savePatientToRegistry(risk);
        }
    }

    function savePatientToRegistry(risk) {
        const firstName = document.getElementById('firstName').value || '';
        const lastName = document.getElementById('lastName').value || '';
        const age = document.getElementById('age').value || '';
        const contact = document.getElementById('regContact')?.value || 'N/A';
        
        const name = `${firstName} ${lastName}`.trim() || 'Unknown Patient';
        const dateStr = new Date().toLocaleDateString();
        
        let registry = JSON.parse(localStorage.getItem('patientRegistry') || '[]');
        
        // Use a unique ID or timestamp to prevent duplicate issues
        const id = Date.now();
        registry.push({ id, firstName, lastName, age, contact, name, risk, date: dateStr });
        localStorage.setItem('patientRegistry', JSON.stringify(registry));
        renderRegistryTable();
    }

    window.deletePatient = function(id) {
        let registry = JSON.parse(localStorage.getItem('patientRegistry') || '[]');
        registry = registry.filter(p => p.id !== id);
        localStorage.setItem('patientRegistry', JSON.stringify(registry));
        renderRegistryTable();
    };

    window.loadPatient = function(id) {
        const registry = JSON.parse(localStorage.getItem('patientRegistry') || '[]');
        const patient = registry.find(p => p.id === id);
        if (patient) {
            // Populate fields
            document.getElementById('regFirstName').value = patient.firstName || '';
            document.getElementById('regLastName').value = patient.lastName || '';
            document.getElementById('regAge').value = patient.age || '';
            document.getElementById('regContact').value = patient.contact || '';
            
            // Trigger the transition
            document.getElementById('mainRegForm').dispatchEvent(new Event('submit'));
        }
    };

    window.renderRegistryTable = function() {
        const tbody = document.getElementById('registryTableBody');
        const emptyMsg = document.getElementById('emptyRegistryMsg');
        const table = document.getElementById('registryTable');
        
        if(!tbody || !emptyMsg || !table) return;
        
        let registry = JSON.parse(localStorage.getItem('patientRegistry') || '[]');
        
        if(registry.length === 0) {
            emptyMsg.style.display = 'block';
            table.style.display = 'none';
        } else {
            emptyMsg.style.display = 'none';
            table.style.display = 'table';
            tbody.innerHTML = '';
            registry.slice().reverse().forEach(p => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td onclick="loadPatient(${p.id})">${p.name}</td>
                    <td onclick="loadPatient(${p.id})">${p.age}</td>
                    <td onclick="loadPatient(${p.id})">${p.contact}</td>
                    <td onclick="loadPatient(${p.id})"><strong>${p.risk}%</strong></td>
                    <td onclick="loadPatient(${p.id})" class="text-muted text-sm">${p.date}</td>
                    <td>
                        <button onclick="deletePatient(${p.id})" class="btn" style="background: rgba(234, 27, 59, 0.1); color: var(--accent-red); border: 1px solid var(--accent-red); padding: 0.2rem 0.5rem; font-size: 0.8rem; border-radius: 4px;">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    };

    renderRegistryTable();

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('cardioTheme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
        if (localStorage.getItem('cardioTheme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
    }

    // Localization
    const langToggle = document.getElementById('langToggle');
    const i18n = {
        en: {
            ".title-wrapper h1": "CardioPredict AI",
            ".title-wrapper p": "Clinical Risk Assessment Dashboard",
            "#registrationView .panel-heading": "Patient Registration",
            "#registrationView .text-muted": "Please register the patient to proceed with the cardiovascular risk assessment.",
            "label[for='regFirstName']": "First Name",
            "label[for='regLastName']": "Last Name",
            "label[for='regContact']": "Contact Info (Email/Phone)",
            "#mainRegForm .btn-primary": "Proceed to Health Assessment ➜",
            ".form-panel h2": "Patient Data Entry",
            "label[for='firstName']": "First Name",
            "label[for='lastName']": "Last Name",
            "label[for='age']": "Age",
            "label[for='sex']": "Sex",
            "label[for='currentSmoker']": "Current Smoker",
            "label[for='cigsPerDay']": "Cigs / Day",
            "label[for='bmi']": "BMI",
            "label[for='sysBP']": "Sys. BP (mmHg)",
            "label[for='diaBP']": "Dia. BP (mmHg)",
            "label[for='heartRate']": "Heart Rate",
            "label[for='totChol']": "Tot. Chol (mg/dL)",
            "label[for='glucose']": "Glucose (mg/dL)",
            "label[for='diabetes']": "Diabetes",
            "#btnGenerate .btn-text": "Generate Assessment",
            ".result-panel h2": "Analysis Results",
            "#resultPlaceholder p": "Awaiting Patient Data"
        },
        hi: {
            ".title-wrapper h1": "कार्डियोप्रिडिक्ट एआई",
            ".title-wrapper p": "क्लिनिकल जोखिम मूल्यांकन डैशबोर्ड",
            "#registrationView .panel-heading": "रोगी पंजीकरण",
            "#registrationView .text-muted": "हृदय जोखिम मूल्यांकन के साथ आगे बढ़ने के लिए कृपया रोगी को पंजीकृत करें।",
            "label[for='regFirstName']": "पहला नाम",
            "label[for='regLastName']": "अंतिम नाम",
            "label[for='regContact']": "संपर्क जानकारी",
            "#mainRegForm .btn-primary": "आगे बढ़ें ➜",
            ".form-panel h2": "रोगी डेटा प्रविष्टि",
            "label[for='firstName']": "पहला नाम",
            "label[for='lastName']": "अंतिम नाम",
            "label[for='age']": "आयु",
            "label[for='sex']": "लिंग",
            "label[for='currentSmoker']": "वर्तमान धूम्रपान",
            "label[for='cigsPerDay']": "सिगरेट / दिन",
            "label[for='bmi']": "बीएमआई",
            "label[for='sysBP']": "सिस्टोलिक बीपी",
            "label[for='diaBP']": "डायस्टोलिक बीपी",
            "label[for='heartRate']": "हृदय गति",
            "label[for='totChol']": "कुल कोलेस्ट्रॉल",
            "label[for='glucose']": "ग्लूकोज",
            "label[for='diabetes']": "मधुमेह",
            "#btnGenerate .btn-text": "भविष्यवाणी उत्पन्न करें",
            ".result-panel h2": "विश्लेषण परिणाम",
            "#resultPlaceholder p": "रोगी डेटा की प्रतीक्षा है"
        },
        bn: {
            ".title-wrapper h1": "কার্ডিওপ্রেডিক্ট এআই",
            ".title-wrapper p": "ক্লিনিক্যাল ঝুঁকি মূল্যায়ন ড্যাশবোর্ড",
            "#registrationView .panel-heading": "রোগী নিবন্ধন",
            "#registrationView .text-muted": "অনুগ্রহ করে রোগীকে নিবন্ধন করুন।",
            "label[for='regFirstName']": "প্রথম নাম",
            "label[for='regLastName']": "শেষ নাম",
            "label[for='regContact']": "যোগাযোগের তথ্য",
            "#mainRegForm .btn-primary": "এগিয়ে যান ➜",
            ".form-panel h2": "রোগীর ডেটা এন্ট্রি",
            "label[for='firstName']": "প্রথম নাম",
            "label[for='lastName']": "শেষ নাম",
            "label[for='age']": "বয়স",
            "label[for='sex']": "লিঙ্গ",
            "label[for='currentSmoker']": "ধূমপায়ী",
            "label[for='cigsPerDay']": "সিগারেট / দিন",
            "label[for='bmi']": "বিএমআই",
            "label[for='sysBP']": "সিস্টোলিক বিপি",
            "label[for='diaBP']": "ডায়াস্টোলিক বিপি",
            "label[for='heartRate']": "হৃদস্পন্দন",
            "label[for='totChol']": "মোট কোলেস্টেরল",
            "label[for='glucose']": "গ্লুকোজ",
            "label[for='diabetes']": "ডায়াবেটিস",
            "#btnGenerate .btn-text": "মূল্যায়ন তৈরি করুন",
            ".result-panel h2": "ফলাফল",
            "#resultPlaceholder p": "ডেটার জন্য অপেক্ষমান"
        },
        te: {
            ".title-wrapper h1": "కార్డియోప్రెడిక్ట్ ఏఐ",
            ".title-wrapper p": "క్లినికల్ రిస్క్ అసెస్‌మెంట్ డాష్‌బోర్డ్",
            "#registrationView .panel-heading": "రోగి నమోదు",
            "#registrationView .text-muted": "దయచేసి రోగిని నమోదు చేయండి.",
            "label[for='regFirstName']": "మొదటి పేరు",
            "label[for='regLastName']": "చివరి పేరు",
            "label[for='regContact']": "సంప్రదింపు సమాచారం",
            "#mainRegForm .btn-primary": "కొనసాగండి ➜",
            ".form-panel h2": "రోగి డేటా ఎంట్రీ",
            "label[for='firstName']": "మొదటి పేరు",
            "label[for='lastName']": "చివరి పేరు",
            "label[for='age']": "వయస్సు",
            "label[for='sex']": "లింగం",
            "label[for='currentSmoker']": "ధూమపానం",
            "label[for='cigsPerDay']": "సిగరెట్లు/రోజు",
            "label[for='bmi']": "బీఎంఐ",
            "label[for='sysBP']": "సిస్టోలిక్ బీపీ",
            "label[for='diaBP']": "డయాస్టోలిక్ బీపీ",
            "label[for='heartRate']": "హృదయ స్పందన రేటు",
            "label[for='totChol']": "మొత్తం కొలెస్ట్రాల్",
            "label[for='glucose']": "గ్లూకోజ్",
            "label[for='diabetes']": "మధుమేహం",
            "#btnGenerate .btn-text": "అంచనా వేయండి",
            ".result-panel h2": "ఫలితాలు",
            "#resultPlaceholder p": "డేటా కోసం వేచి ఉంది"
        },
        mr: {
            ".title-wrapper h1": "कार्डिओप्रेडिक्ट एआय",
            ".title-wrapper p": "क्लिनिकल जोखीम मूल्यांकन डॅशबोर्ड",
            "#registrationView .panel-heading": "रुग्ण नोंदणी",
            "#registrationView .text-muted": "कृपया रुग्णाची नोंदणी करा.",
            "label[for='regFirstName']": "पहिले नाव",
            "label[for='regLastName']": "आडनाव",
            "label[for='regContact']": "संपर्क माहिती",
            "#mainRegForm .btn-primary": "पुढे जा ➜",
            ".form-panel h2": "रुग्ण डेटा एंट्री",
            "label[for='firstName']": "पहिले नाव",
            "label[for='lastName']": "आडनाव",
            "label[for='age']": "वय",
            "label[for='sex']": "लिंग",
            "label[for='currentSmoker']": "धूम्रपान",
            "label[for='cigsPerDay']": "सिगारेट / दिवस",
            "label[for='bmi']": "बीएमआय",
            "label[for='sysBP']": "सिस्टोलिक बीपी",
            "label[for='diaBP']": "डायस्टोलिक बीपी",
            "label[for='heartRate']": "हृदय गती",
            "label[for='totChol']": "एकूण कोलेस्ट्रॉल",
            "label[for='glucose']": "ग्लुकोज",
            "label[for='diabetes']": "मधुमेह",
            "#btnGenerate .btn-text": "मूल्यांकन करा",
            ".result-panel h2": "निकाल",
            "#resultPlaceholder p": "डेटाची प्रतीक्षा आहे"
        },
        ta: {
            ".title-wrapper h1": "கார்டியோபிரெடிக்ட் ஏஐ",
            ".title-wrapper p": "மருத்துவ இடர் மதிப்பீட்டு டாஷ்போர்டு",
            "#registrationView .panel-heading": "நோயாளி பதிவு",
            "#registrationView .text-muted": "தயவுசெய்து நோயாளியைப் பதிவு செய்யவும்.",
            "label[for='regFirstName']": "முதல் பெயர்",
            "label[for='regLastName']": "கடைசி பெயர்",
            "label[for='regContact']": "தொடர்பு தகவல்",
            "#mainRegForm .btn-primary": "தொடரவும் ➜",
            ".form-panel h2": "நோயாளி தரவு உள்ளீடு",
            "label[for='firstName']": "முதல் பெயர்",
            "label[for='lastName']": "கடைசி பெயர்",
            "label[for='age']": "வயது",
            "label[for='sex']": "பாலினம்",
            "label[for='currentSmoker']": "புகைப்பிடிப்பவர்",
            "label[for='cigsPerDay']": "சிகரெட்/நாள்",
            "label[for='bmi']": "பிஎம்ஐ",
            "label[for='sysBP']": "சிஸ்டாலிக் பிபி",
            "label[for='diaBP']": "டயஸ்டாலிக் பிபி",
            "label[for='heartRate']": "இதய துடிப்பு",
            "label[for='totChol']": "மொத்த கொலஸ்ட்ரால்",
            "label[for='glucose']": "குளுக்கோஸ்",
            "label[for='diabetes']": "நீரிழிவு",
            "#btnGenerate .btn-text": "மதிப்பீடு செய்",
            ".result-panel h2": "முடிவுகள்",
            "#resultPlaceholder p": "தரவுக்காக காத்திருக்கிறது"
        },
        gu: {
            ".title-wrapper h1": "કાર્ડિયોપ્રેડિક્ટ એઆઈ",
            ".title-wrapper p": "ક્લિનિકલ જોખમ મૂલ્યાંકન ડેશબોર્ડ",
            "#registrationView .panel-heading": "દર્દીની નોંધણી",
            "#registrationView .text-muted": "કૃપા કરીને દર્દીની નોંધણી કરો.",
            "label[for='regFirstName']": "પ્રથમ નામ",
            "label[for='regLastName']": "અંતિમ નામ",
            "label[for='regContact']": "સંપર્ક માહિતી",
            "#mainRegForm .btn-primary": "આગળ વધો ➜",
            ".form-panel h2": "દર્દી ડેટા એન્ટ્રી",
            "label[for='firstName']": "પ્રથમ નામ",
            "label[for='lastName']": "અંતિમ નામ",
            "label[for='age']": "ઉંમર",
            "label[for='sex']": "લિંગ",
            "label[for='currentSmoker']": "ધૂમ્રપાન કરનાર",
            "label[for='cigsPerDay']": "સિગારેટ/દિવસ",
            "label[for='bmi']": "બીએમઆઈ",
            "label[for='sysBP']": "સિસ્ટોલિક બીપી",
            "label[for='diaBP']": "ડાયસ્ટોલિક બીપી",
            "label[for='heartRate']": "હૃદય દર",
            "label[for='totChol']": "કુલ કોલેસ્ટ્રોલ",
            "label[for='glucose']": "ગ્લુકોઝ",
            "label[for='diabetes']": "ડાયાબિટીસ",
            "#btnGenerate .btn-text": "મૂલ્યાંકન કરો",
            ".result-panel h2": "પરિણામો",
            "#resultPlaceholder p": "ડેટાની રાહ જોઈ રહ્યા છીએ"
        },
        kn: {
            ".title-wrapper h1": "ಕಾರ್ಡಿಯೋಪ್ರೆಡಿಕ್ಟ್ ಎಐ",
            ".title-wrapper p": "ವೈದ್ಯಕೀಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ",
            "#registrationView .panel-heading": "ರೋಗಿಯ ನೋಂದಣಿ",
            "#registrationView .text-muted": "ದಯವಿಟ್ಟು ರೋಗಿಯನ್ನು ನೋಂದಾಯಿಸಿ.",
            "label[for='regFirstName']": "ಮೊದಲ ಹೆಸರು",
            "label[for='regLastName']": "ಕೊನೆಯ ಹೆಸರು",
            "label[for='regContact']": "ಸಂಪರ್ಕ ಮಾಹಿತಿ",
            "#mainRegForm .btn-primary": "ಮುಂದುವರಿಯಿರಿ ➜",
            ".form-panel h2": "ರೋಗಿಯ ಡೇಟಾ ಎಂಟ್ರಿ",
            "label[for='firstName']": "ಮೊದಲ ಹೆಸರು",
            "label[for='lastName']": "ಕೊನೆಯ ಹೆಸರು",
            "label[for='age']": "ವಯಸ್ಸು",
            "label[for='sex']": "ಲಿಂಗ",
            "label[for='currentSmoker']": "ಧೂಮಪಾನಿ",
            "label[for='cigsPerDay']": "ಸಿಗರೇಟುಗಳು/ದಿನ",
            "label[for='bmi']": "ಬಿಎಂಐ",
            "label[for='sysBP']": "ಸಿಸ್ಟೊಲಿಕ್ ಬಿಪಿ",
            "label[for='diaBP']": "ಡಯಾಸ್ಟೊಲಿಕ್ ಬಿಪಿ",
            "label[for='heartRate']": "ಹೃದಯ ಬಡಿತ",
            "label[for='totChol']": "ಒಟ್ಟು ಕೊಲೆಸ್ಟ್ರಾಲ್",
            "label[for='glucose']": "ಗ್ಲೂಕೋಸ್",
            "label[for='diabetes']": "ಮಧುಮೇಹ",
            "#btnGenerate .btn-text": "ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ",
            ".result-panel h2": "ಫಲಿತಾಂಶಗಳು",
            "#resultPlaceholder p": "ಡೇಟಾಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ"
        },
        ml: {
            ".title-wrapper h1": "കാർഡിയോപ്രെഡിക്റ്റ് എഐ",
            ".title-wrapper p": "ക്ലിനിക്കൽ റിസ്ക് അസസ്മെന്റ്",
            "#registrationView .panel-heading": "രോഗി രജിസ്ട്രേഷൻ",
            "#registrationView .text-muted": "ദയവായി രോഗിയെ രജിസ്റ്റർ ചെയ്യുക.",
            "label[for='regFirstName']": "ആദ്യ പേര്",
            "label[for='regLastName']": "അവസാന പേര്",
            "label[for='regContact']": "ബന്ധപ്പെടാനുള്ള വിവരം",
            "#mainRegForm .btn-primary": "തുടരുക ➜",
            ".form-panel h2": "രോഗിയുടെ ഡാറ്റ എൻട്രി",
            "label[for='firstName']": "ആദ്യ പേര്",
            "label[for='lastName']": "അവസാന പേര്",
            "label[for='age']": "പ്രായം",
            "label[for='sex']": "ലിംഗം",
            "label[for='currentSmoker']": "പുകവലിക്കുന്നയാൾ",
            "label[for='cigsPerDay']": "സിഗരറ്റ്/ദിവസം",
            "label[for='bmi']": "ബിഎംഐ",
            "label[for='sysBP']": "സിസ്റ്റോളിക് ബിപി",
            "label[for='diaBP']": "ഡയസ്റ്റോളിക് ബിപി",
            "label[for='heartRate']": "ഹൃദയമിടിപ്പ്",
            "label[for='totChol']": "മൊത്തം കൊളസ്ട്രോൾ",
            "label[for='glucose']": "ഗ്ലൂക്കോസ്",
            "label[for='diabetes']": "പ്രമേഹം",
            "#btnGenerate .btn-text": "വിലയിരുത്തുക",
            ".result-panel h2": "ഫലങ്ങൾ",
            "#resultPlaceholder p": "ഡാറ്റയ്ക്കായി കാത്തിരിക്കുന്നു"
        },
        or: {
            ".title-wrapper h1": "କାର୍ଡିଓପ୍ରେଡିକ୍ଟ ଏଆଇ",
            ".title-wrapper p": "କ୍ଲିନିକାଲ୍ ରିସ୍କ ଆସେସମେଣ୍ଟ",
            "#registrationView .panel-heading": "ରୋଗୀ ପଞ୍ଜୀକରଣ",
            "#registrationView .text-muted": "ଦୟାକରି ରୋଗୀଙ୍କୁ ପଞ୍ଜିକରଣ କରନ୍ତୁ |",
            "label[for='regFirstName']": "ପ୍ରଥମ ନାମ",
            "label[for='regLastName']": "ଶେଷ ନାମ",
            "label[for='regContact']": "ସମ୍ପର୍କ ସୂଚନା",
            "#mainRegForm .btn-primary": "ଆଗକୁ ବଢନ୍ତୁ ➜",
            ".form-panel h2": "ରୋଗୀ ଡାଟା ଏଣ୍ଟ୍ରି",
            "label[for='firstName']": "ପ୍ରଥମ ନାମ",
            "label[for='lastName']": "ଶେଷ ନାମ",
            "label[for='age']": "ବୟସ",
            "label[for='sex']": "ଲିଙ୍ഗ",
            "label[for='currentSmoker']": "ଧୂମପାନ କରୁଛନ୍ତି କି",
            "label[for='cigsPerDay']": "ସିଗାରେଟ୍ / ଦିନ",
            "label[for='bmi']": "ବିଏମଆଇ",
            "label[for='sysBP']": "ସିଷ୍ଟୋଲିକ୍ ବିପି",
            "label[for='diaBP']": "ଡାୟାଷ୍ଟୋଲିକ୍ ବିପି",
            "label[for='heartRate']": "ହୃଦସ୍ପନ୍ଦନ",
            "label[for='totChol']": "ମୋਟ କୋଲେଷ୍ଟ୍ରୋଲ୍",
            "label[for='glucose']": "ଗ୍ଲୁକୋଜ୍",
            "label[for='diabetes']": "ମଧୁମେହ",
            "#btnGenerate .btn-text": "ମୂଲ୍ୟାଙ୍କନ କରନ୍ତୁ",
            ".result-panel h2": "ଫଳାଫଳ",
            "#resultPlaceholder p": "ଡାଟାକୁ ଅପେକ୍ଷା କରାଯାଇଛି"
        },
        pa: {
            ".title-wrapper h1": "ਕਾਰਡੀਓਪ੍ਰੇਡਿਕਟ ਏਆਈ",
            ".title-wrapper p": "ਕਲੀਨਿਕਲ ਜੋਖਮ ਮੁਲਾਂਕਣ ਡੈਸ਼ਬੋਰਡ",
            "#registrationView .panel-heading": "ਮਰੀਜ਼ ਰਜਿਸਟਰੇਸ਼ਨ",
            "#registrationView .text-muted": "ਕਿਰਪਾ ਕਰਕੇ ਮਰੀਜ਼ ਨੂੰ ਰਜਿਸਟਰ ਕਰੋ।",
            "label[for='regFirstName']": "ਪਹਿਲਾ ਨਾਂ",
            "label[for='regLastName']": "ਆਖਰੀ ਨਾਂ",
            "label[for='regContact']": "ਸੰਪਰਕ ਜਾਣਕਾਰੀ",
            "#mainRegForm .btn-primary": "ਅੱਗੇ ਵਧੋ ➜",
            ".form-panel h2": "ਮਰੀਜ਼ ਡੇਟਾ ਐਂਟਰੀ",
            "label[for='firstName']": "ਪਹਿਲਾ ਨਾਂ",
            "label[for='lastName']": "ਆਖਰੀ ਨਾਂ",
            "label[for='age']": "ਉਮਰ",
            "label[for='sex']": "ਲਿੰਗ",
            "label[for='currentSmoker']": "ਸਿਗਰਟ ਪੀਣ ਵਾਲਾ",
            "label[for='cigsPerDay']": "ਸਿਗਰਟ / ਦਿਨ",
            "label[for='bmi']": "ਬੀਐਮਆਈ",
            "label[for='sysBP']": "ਸਿਸਟੋਲਿਕ ਬੀਪੀ",
            "label[for='diaBP']": "ਡਾਇਸਟੋਲਿਕ ਬੀਪੀ",
            "label[for='heartRate']": "ਦਿਲ ਦੀ ਗਤੀ",
            "label[for='totChol']": "ਕੁੱਲ ਕੋਲੈਸਟ੍ਰੋਲ",
            "label[for='glucose']": "ਗਲੂਕੋਜ਼",
            "label[for='diabetes']": "ਸ਼ੂਗਰ",
            "#btnGenerate .btn-text": "ਮੁਲਾਂਕਣ ਕਰੋ",
            ".result-panel h2": "ਨਤੀਜੇ",
            "#resultPlaceholder p": "ਡੇਟਾ ਦੀ ਉਡੀਕ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ"
        },
        as: {
            ".title-wrapper h1": "কাৰ্ডিঅ'প্ৰেডিক্ট এআই",
            ".title-wrapper p": "ক্লিনিকেল বিপদ মূল্যায়ন ডেচবোৰ্ড",
            "#registrationView .panel-heading": "ৰোগী পঞ্জীয়ন",
            "#registrationView .text-muted": "অনুগ্ৰহ কৰি ৰোগীক পঞ্জীয়ন কৰক।",
            "label[for='regFirstName']": "প্ৰথম নাম",
            "label[for='regLastName']": "শেষ নাম",
            "label[for='regContact']": "যোগাযোগৰ তথ্য",
            "#mainRegForm .btn-primary": "আগলৈ যাওক ➜",
            ".form-panel h2": "ৰোগীৰ তথ্য অন্তৰ্ভুক্ত",
            "label[for='firstName']": "প্ৰথম নাম",
            "label[for='lastName']": "শেষ নাম",
            "label[for='age']": "বয়স",
            "label[for='sex']": "লিংগ",
            "label[for='currentSmoker']": "ধূমপায়ী",
            "label[for='cigsPerDay']": "চিগাৰেট / দিন",
            "label[for='bmi']": "বিএমআই",
            "label[for='sysBP']": "চিষ্টলিক বিপি",
            "label[for='diaBP']": "ডায়েষ্টলিক বিপি",
            "label[for='heartRate']": "হৃদস্পন্দন",
            "label[for='totChol']": "মুঠ কলেষ্টেৰল",
            "label[for='glucose']": "গ্লুকোজ",
            "label[for='diabetes']": "ডায়াবেটিস",
            "#btnGenerate .btn-text": "মূল্যায়ন কৰক",
            ".result-panel h2": "ফলাফল",
            "#resultPlaceholder p": "তথ্যৰ বাবে অপেক্ষা কৰি থকা হৈছে"
        }
    };

    if (langToggle) {
        langToggle.addEventListener('change', (e) => {
            currentLang = e.target.value;
            const dict = i18n[currentLang] || i18n['en'];
            for (const selector in dict) {
                const el = document.querySelector(selector);
                if (el) {
                    el.innerHTML = dict[selector];
                }
            }
            if (lastRiskObj !== null) updateResultUI(lastRiskObj.risk, true);
        });
    }

    // UI Flow Handling
    const mainRegForm = document.getElementById('mainRegForm');
    const registrationView = document.getElementById('registrationView');
    const healthView = document.getElementById('healthView');
    const btnNewPatient = document.getElementById('btnNewPatient');

    function saveState() {
        const state = {
            isRegistered: registrationView.classList.contains('hidden'),
            regFirstName: document.getElementById('regFirstName')?.value || '',
            regLastName: document.getElementById('regLastName')?.value || '',
            regAge: document.getElementById('regAge')?.value || '',
            regContact: document.getElementById('regContact')?.value || '',
            age: document.getElementById('regAge')?.value || document.getElementById('age')?.value || '',
            sex: document.getElementById('sex')?.value || '',
            currentSmoker: document.getElementById('currentSmoker')?.value || '',
            cigsPerDay: document.getElementById('cigsPerDay')?.value || '',
            bmi: document.getElementById('bmi')?.value || '',
            sysBP: document.getElementById('sysBP')?.value || '',
            diaBP: document.getElementById('diaBP')?.value || '',
            heartRate: document.getElementById('heartRate')?.value || '',
            totChol: document.getElementById('totChol')?.value || '',
            glucose: document.getElementById('glucose')?.value || '',
            diabetes: document.getElementById('diabetes')?.value || ''
        };
        localStorage.setItem('cardioPredictState', JSON.stringify(state));
    }

    function loadState() {
        const stateStr = localStorage.getItem('cardioPredictState');
        if(stateStr) {
            try {
                const state = JSON.parse(stateStr);
                
                if(document.getElementById('regFirstName')) document.getElementById('regFirstName').value = state.regFirstName || '';
                if(document.getElementById('regLastName')) document.getElementById('regLastName').value = state.regLastName || '';
                if(document.getElementById('regAge')) document.getElementById('regAge').value = state.regAge || '';
                if(document.getElementById('regContact')) document.getElementById('regContact').value = state.regContact || '';
                
                document.getElementById('firstName').value = state.regFirstName || '';
                document.getElementById('lastName').value = state.regLastName || '';
                
                if(document.getElementById('age')) document.getElementById('age').value = state.regAge || state.age || '';
                if(document.getElementById('sex')) document.getElementById('sex').value = state.sex || '';
                if(document.getElementById('currentSmoker')) {
                    document.getElementById('currentSmoker').value = state.currentSmoker || '';
                    if(window.toggleCigs) window.toggleCigs();
                }
                if(document.getElementById('cigsPerDay')) document.getElementById('cigsPerDay').value = state.cigsPerDay || '';
                if(document.getElementById('bmi')) document.getElementById('bmi').value = state.bmi || '';
                if(document.getElementById('sysBP')) document.getElementById('sysBP').value = state.sysBP || '';
                if(document.getElementById('diaBP')) document.getElementById('diaBP').value = state.diaBP || '';
                if(document.getElementById('heartRate')) document.getElementById('heartRate').value = state.heartRate || '';
                if(document.getElementById('totChol')) document.getElementById('totChol').value = state.totChol || '';
                if(document.getElementById('glucose')) document.getElementById('glucose').value = state.glucose || '';
                if(document.getElementById('diabetes')) document.getElementById('diabetes').value = state.diabetes || '';

                // USER REQUEST: Always start from Window 1 (registration)
                // So we do NOT transition here even if isRegistered was true in previous session.
                registrationView.classList.remove('hidden');
                healthView.classList.add('hidden');
                btnNewPatient.style.display = 'none';
            } catch(e) {}
        }
    }

    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', saveState);
        el.addEventListener('change', saveState);
    });

    if(mainRegForm) {
        mainRegForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fName = document.getElementById('regFirstName').value;
            const lName = document.getElementById('regLastName').value;
            const rAge = document.getElementById('regAge').value;
            
            document.getElementById('firstName').value = fName;
            document.getElementById('lastName').value = lName;
            document.getElementById('age').value = rAge;
            
            registrationView.classList.add('hidden');
            setTimeout(() => {
                healthView.classList.remove('hidden');
                btnNewPatient.style.display = 'block';
                saveState();
                if (langToggle) langToggle.dispatchEvent(new Event('change'));
            }, 500);
        });
    }

    if(btnNewPatient) {
        btnNewPatient.addEventListener('click', () => {
            mainRegForm.reset();
            document.getElementById('predictionForm').reset();
            document.getElementById('resultPlaceholder').style.display = 'flex';
            document.getElementById('resultContent').classList.add('hidden');
            lastRiskObj = null;
            localStorage.removeItem('cardioPredictState');
            healthView.classList.add('hidden');
            btnNewPatient.style.display = 'none';
            setTimeout(() => {
                registrationView.classList.remove('hidden');
                if (window.renderRegistryTable) window.renderRegistryTable();
            }, 500);
        });
    }

    loadState();
});
