/* --- DATA SOURCE --- */
const prompts = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
        title: "Portrait to Cyberpunk Warrior",
        text: "Reference the facial structure of the subject provided. Objective: Recreate this exact person as a high-tech cyberpunk warrior. Maintain the exact jawline, eye shape, nose bridge, and facial proportions of the original subject. Do not smooth the skin excessively; keep natural skin texture. Outfit: Matte black carbon-fiber tactical armor with neon violet glowing trim. Background: A rainy, dystopian Tokyo street at midnight with holographic advertisements reflecting in puddles. Lighting: Cinematic, volumetric lighting striking the face from the left (teal) and right (magenta). Style: Unreal Engine 5 render, 8k resolution, highly detailed."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
        title: "Male Model to Viking King",
        text: "Generate an image of the person in the reference photo, ensuring 100% facial consistency. The subject must be instantly recognizable as the same person. Transformation: Place him in the era of Vikings. Outfit: Heavy fur cloak over chainmail armor, wearing a weathered iron crown. Facial features: Keep the same face but add a realistic, groomed beard if not present (optional) or maintain clean-shaven if preferred, but structure must remain identical. Setting: Standing on the bow of a wooden longship in a stormy sea. Atmosphere: Moody, desaturated cold tones, dramatic sky."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=500&q=80",
        title: "Corporate to Fantasy Elf",
        text: "Using the facial landmarks of the provided subject, generate a high-fantasy portrait. Strict Constraint: Do not alter the subject's bone structure, ethnicity, or eye distance. Modification: Add elegant, pointed elven ears and long, flowing silver hair. Attire: Intricate silk robes with gold embroidery and a jeweled headpiece. Background: An ancient library inside a giant tree, illuminated by floating magical orbs. Lighting: Soft, warm, ethereal glow. Style: Oil painting aesthetic mixed with photorealism."
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
        title: "Casual to 1920s Detective",
        text: "Transplant the face of the subject into a 1920s Noir film scene. Preservation: The face must match the reference photo perfectly (same nose, mouth, eyes, scars/moles if any). Costume: A beige trench coat with the collar popped up and a fedora hat casting a slight shadow over the forehead. Activity: Lighting a cigarette in a misty cobblestone alleyway. aesthetic: Black and white photography with high contrast (Chiaroscuro lighting)."
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",
        title: "Student to Space Marine",
        text: "Create a cinematic shot of the subject as a sci-fi space marine. Requirement: The facial identity must remain unchanged from the source image. Check cheekbones and eye shape for accuracy. Gear: Bulky, battle-worn white space armor with scratches and decals. Helmet: The helmet is removed and held under the arm. Environment: The surface of Mars, with red dust swirling in the air and a rover in the distance. Lighting: Harsh sunlight casting strong shadows (golden hour on Mars)."
    },
    {
        id: 6,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
        title: "Modern to Medieval Peasant",
        text: "Re-imagine the subject in a historical medieval setting. Face Constraint: Keep the face exactly as it appears in the original photo, preserving the unique identity. Attire: Rough, woven linen tunic and a leather apron. Props: Holding a basket of fresh bread or apples. Background: A busy medieval market square with timber-framed houses and cobblestone streets. Lighting: Bright, natural morning sunlight."
    }
];

/* --- STATE MANAGEMENT --- */
const COST_PER_COPY = 10;
const DEFAULT_TOKENS = 50;
const PREMIUM_TOKENS = 500;
let pendingTextToCopy = ""; // Stores text while ad plays

function getTokens() {
    const storedDate = localStorage.getItem('promptDate');
    const today = new Date().toDateString();

    if (storedDate !== today) {
        localStorage.setItem('promptDate', today);
        localStorage.setItem('promptTokens', DEFAULT_TOKENS);
        return DEFAULT_TOKENS;
    }
    return parseInt(localStorage.getItem('promptTokens')) || 0;
}

function updateTokenDisplay(count) {
    const el = document.getElementById('token-count');
    el.innerText = count;
    if(count < 10) el.style.color = 'var(--danger)';
    else el.style.color = 'var(--success)';
}

/* --- RENDER CARDS --- */
const grid = document.getElementById('image-grid');

prompts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${p.image}" alt="${p.title}" class="card-img">
        <div class="card-body">
            <h3 class="prompt-title">${p.title}</h3>
            <div class="prompt-text-container">
                <div class="prompt-text" id="text-${p.id}">${p.text}</div>
                <span class="read-more" onclick="toggleReadMore('text-${p.id}', this)">Read full command</span>
            </div>
            <button class="copy-btn" onclick="initiateCopyProcess('${p.text.replace(/'/g, "\\'")}')">
                <span>📋</span> Copy Command (-10 Tokens)
            </button>
        </div>
    `;
    grid.appendChild(card);
});

/* --- UI ACTIONS --- */

function toggleReadMore(elementId, btn) {
    const textEl = document.getElementById(elementId);
    textEl.classList.toggle('expanded');
    btn.innerText = textEl.classList.contains('expanded') ? "Collapse command" : "Read full command";
}

function initiateCopyProcess(text) {
    let currentTokens = getTokens();

    if (currentTokens < COST_PER_COPY) {
        openSubscribeModal();
        return;
    }

    pendingTextToCopy = text;
    openAdModal();
}

function openAdModal() {
    const adModal = document.getElementById('adModal');
    const timerDisplay = document.getElementById('adTimerDisplay');
    
    adModal.style.display = 'flex';
    let secondsLeft = 5;
    timerDisplay.innerText = `Ad closing in ${secondsLeft}s...`;

    const timer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            timerDisplay.innerText = `Ad closing in ${secondsLeft}s...`;
        } else {
            clearInterval(timer);
            closeAdModal();
            executeFinalCopy();
        }
    }, 1000);
}

function closeAdModal() {
    document.getElementById('adModal').style.display = 'none';
}

function executeFinalCopy() {
    navigator.clipboard.writeText(pendingTextToCopy).then(() => {
        let currentTokens = getTokens();
        currentTokens -= COST_PER_COPY;
        localStorage.setItem('promptTokens', currentTokens);
        
        updateTokenDisplay(currentTokens);
        showToast(`Copied! ${currentTokens} tokens remaining.`);
    });
}

function subscribeUser() {
    localStorage.setItem('promptTokens', PREMIUM_TOKENS);
    updateTokenDisplay(PREMIUM_TOKENS);
    closeSubscribeModal();
    showToast("Subscribed! 500 Tokens added.");
}

function openSubscribeModal() {
    document.getElementById('subModal').style.display = 'flex';
}

function closeSubscribeModal() {
    document.getElementById('subModal').style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* --- INITIAL LOAD --- */
updateTokenDisplay(getTokens());

/* --- Add to the bottom of script.js --- */

const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('#nav-actions');

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});

// Close menu when a button is clicked (like Subscribe)
document.querySelectorAll('.nav-actions .btn').forEach(n => n.addEventListener('click', () => {
    menu.classList.remove('is-active');
    menuLinks.classList.remove('active');
}));
