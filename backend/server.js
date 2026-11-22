import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import open from 'open';
import { exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';
import { captureDesktopScreen } from './desktopVision.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env reliably from backend directory or project root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const distPath = path.join(__dirname, '../frontend/dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes('YahanPasteKarein')) {
    console.warn('\n⚠️ WARNING: Please set a valid GEMINI_API_KEY in backend/.env to enable Gemini AI.\n');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// 1. Tool Declaration: Open Desktop Applications
const openApplicationDeclaration = {
    name: 'openApplication',
    description: 'Opens desktop applications on the Windows PC such as VS Code, Chrome, Edge, Notepad, Calculator, Terminal/CMD, File Explorer, WhatsApp, or Spotify.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            appName: {
                type: Type.STRING,
                description: 'The lowercase name of the app: vscode, chrome, edge, notepad, calculator, cmd, terminal, explorer, whatsapp, spotify, paint, taskmanager'
            }
        },
        required: ['appName']
    }
};

// 2. Tool Declaration: Web & Search Automation
const openWebsiteDeclaration = {
    name: 'openWebsite',
    description: 'Searches Google, GitHub, or StackOverflow or opens specific web URLs. NEVER use for songs, music, or videos (ALWAYS use playMusic instead).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            platform: {
                type: Type.STRING,
                description: 'Target platform: "url", "google", "github", or "stackoverflow". NEVER use "youtube" for music/songs.'
            },
            queryOrUrl: {
                type: Type.STRING,
                description: 'Full URL if platform is "url", or search query if platform is "google", "github", etc.'
            }
        },
        required: ['platform', 'queryOrUrl']
    }
};

// 3. Tool Declaration: System Controls & Folder Navigation
const systemControlDeclaration = {
    name: 'systemControl',
    description: 'Controls Windows actions like locking screen, opening common folders (Desktop, Downloads, Documents), or creating a project folder.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: {
                type: Type.STRING,
                description: 'Action to perform: "lock", "create_folder", "open_downloads", "open_desktop", "open_documents"'
            },
            folderName: {
                type: Type.STRING,
                description: 'Name of the folder to create if action is "create_folder"'
            }
        },
        required: ['action']
    }
};

// 4. Tool Declaration: Hardware & Volume Control
const hardwareControlDeclaration = {
    name: 'hardwareControl',
    description: 'Controls hardware settings on Windows like volume up, volume down, mute/unmute, checking battery percentage, or putting PC to sleep.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: {
                type: Type.STRING,
                description: 'Action: "volume_up", "volume_down", "volume_mute", "battery_status", "sleep_pc"'
            }
        },
        required: ['action']
    }
};

// 5. Tool Declaration: Music & Video In-App Media Player
const playMusicDeclaration = {
    name: 'playMusic',
    description: 'Plays any requested song, video, artist, lofi chill beats, or music directly inside Senorita in-app embedded video/audio player without opening external apps or windows.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'Song name, video title, artist, or vibe (e.g. "lofi chill beats", "Arijit Singh", "relaxing piano", "tech video")'
            },
            platform: {
                type: Type.STRING,
                description: 'Default "youtube"'
            }
        },
        required: ['query']
    }
};

// 6. Tool Declaration: Remember Personal Fact
const manageMemoryDeclaration = {
    name: 'manageMemory',
    description: 'Saves an important personal fact, preference, or project detail about Faisal into permanent long-term memory.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            fact: {
                type: Type.STRING,
                description: 'The personal fact or detail to remember permanently (e.g. "Faisal is learning Next.js", "Faisal likes coffee")'
            }
        },
        required: ['fact']
    }
};

// 7. Tool Declaration: Draft & Send Email (JARVIS Email Assistant)
const sendEmailDeclaration = {
    name: 'sendEmail',
    description: 'Drafts, composes, and sends an email. Formats professional subject, recipient, and full courteous body text.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            to: {
                type: Type.STRING,
                description: 'Recipient email address (e.g. "team@example.com" or empty if user didn\'t specify)'
            },
            subject: {
                type: Type.STRING,
                description: 'Clear, professional subject line of the email'
            },
            body: {
                type: Type.STRING,
                description: 'Full, well-structured, professional body of the email with greeting, message, and sign-off'
            }
        },
        required: ['subject', 'body']
    }
};

// Tool Execution Handlers
function executeWindowsApp(appName, userName = 'Boss') {
    const key = (appName || '').toLowerCase().trim();
    const appMap = {
        whatsapp: { cmd: 'start whatsapp:', url: 'https://web.whatsapp.com', name: 'WhatsApp' },
        spotify: { cmd: 'start spotify:', url: 'https://open.spotify.com', name: 'Spotify' },
        chrome: { cmd: 'start chrome', url: 'https://www.google.com', name: 'Google Chrome' },
        edge: { cmd: 'start msedge', url: 'https://www.bing.com', name: 'Microsoft Edge' },
        vscode: { cmd: 'code', url: 'https://vscode.dev', name: 'VS Code' },
        code: { cmd: 'code', url: 'https://vscode.dev', name: 'VS Code' },
        calculator: { cmd: 'calc', url: 'https://www.google.com/search?q=calculator', name: 'Calculator' },
        notepad: { cmd: 'notepad', url: 'https://notepad-online.com', name: 'Notepad' },
        terminal: { cmd: 'start cmd', url: '', name: 'Terminal' },
        cmd: { cmd: 'start cmd', url: '', name: 'Command Prompt' },
        paint: { cmd: 'mspaint', url: 'https://jspaint.app', name: 'Paint' },
        explorer: { cmd: 'explorer', url: '', name: 'File Explorer' },
        taskmanager: { cmd: 'start taskmgr', url: '', name: 'Task Manager' },
        instagram: { cmd: 'start https://www.instagram.com', url: 'https://www.instagram.com', name: 'Instagram' },
        youtube: { cmd: 'start https://www.youtube.com', url: 'https://www.youtube.com', name: 'YouTube' },
        facebook: { cmd: 'start https://www.facebook.com', url: 'https://www.facebook.com', name: 'Facebook' },
        github: { cmd: 'start https://github.com', url: 'https://github.com', name: 'GitHub' },
        chatgpt: { cmd: 'start https://chatgpt.com', url: 'https://chatgpt.com', name: 'ChatGPT' },
        telegram: { cmd: 'start https://web.telegram.org', url: 'https://web.telegram.org', name: 'Telegram' },
        maps: { cmd: 'start https://maps.google.com', url: 'https://maps.google.com', name: 'Google Maps' },
        gmail: { cmd: 'start https://mail.google.com', url: 'https://mail.google.com', name: 'Gmail' }
    };

    const target = appMap[key] || {
        cmd: `start ${key}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(appName)}`,
        name: appName || 'App'
    };

    if (process.platform === 'win32' && target.cmd) {
        exec(target.cmd, (err) => {
            if (err) console.error(`Error executing ${target.cmd}:`, err);
        });
    }

    return {
        reply: `Yes Boss! ${target.name} open kar rahi hoon.`,
        action: `Opened ${target.name}`,
        actionData: {
            type: 'OPEN_URL',
            url: target.url || '',
            appName: target.name
        }
    };
}

async function executeWebsite(platform, queryOrUrl, userName = 'Boss') {
    const p = (platform || '').toLowerCase().trim();
    const q = (queryOrUrl || '').trim();

    // NEVER open external tab for YouTube, songs, music, or videos! Play directly in-app!
    if (p === 'youtube' || /(?:song|gana|gaana|music|video|lofi|track|singh|kapoor|chalao|play|sunao)/i.test(q)) {
        return await executePlayMusic(q, 'youtube', userName);
    }

    let url = '';
    let actionDesc = '';
    let appName = 'Website';

    if (p === 'google') {
        url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched Google for "${q}"`;
        appName = 'Google Search';
    } else if (p === 'github') {
        url = `https://github.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched GitHub for "${q}"`;
        appName = 'GitHub';
    } else if (p === 'stackoverflow') {
        url = `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched StackOverflow for "${q}"`;
        appName = 'StackOverflow';
    } else {
        url = q.startsWith('http://') || q.startsWith('https://') ? q : `https://${q}`;
        actionDesc = `Opened ${url}`;
        appName = 'Link';
    }

    if (process.platform === 'win32') {
        try {
            await open(url);
        } catch (err) {
            console.error('Error opening website:', err);
        }
    }

    return {
        reply: `Yes Boss! ${actionDesc}.`,
        action: actionDesc,
        actionData: {
            type: 'OPEN_URL',
            url: url,
            appName: appName
        }
    };
}

function executeSystemControl(action, folderName, userName = 'Boss') {
    const act = action.toLowerCase().trim();

    if (act === 'lock') {
        if (process.platform === 'win32') exec('rundll32.exe user32.dll,LockWorkStation');
        return { reply: `Yes Boss! Locking your PC screen now.`, action: 'Locked PC Screen' };
    } else if (act === 'create_folder' && folderName) {
        const safeName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (process.platform === 'win32') exec(`mkdir "%USERPROFILE%\\Desktop\\${safeName}"`);
        return { reply: `Yes Boss! Created folder "${safeName}" on your Desktop.`, action: `Created folder: ${safeName}` };
    } else if (act === 'open_downloads') {
        if (process.platform === 'win32') exec('explorer "%USERPROFILE%\\Downloads"');
        return { reply: 'Yes Boss! Opened your Downloads folder.', action: 'Opened Downloads' };
    } else if (act === 'open_desktop') {
        if (process.platform === 'win32') exec('explorer "%USERPROFILE%\\Desktop"');
        return { reply: 'Yes Boss! Opened your Desktop folder.', action: 'Opened Desktop' };
    } else if (act === 'open_documents') {
        if (process.platform === 'win32') exec('explorer "%USERPROFILE%\\Documents"');
        return { reply: 'Yes Boss! Opened your Documents folder.', action: 'Opened Documents' };
    }

    return { reply: 'Yes Boss! Action completed.', action: act };
}

function executeHardwareControl(action, userName = 'Boss') {
    const act = action.toLowerCase().trim();
    if (act === 'volume_up') {
        if (process.platform === 'win32') exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]175); (New-Object -ComObject WScript.Shell).SendKeys([char]175)"');
        return { reply: `Yes Boss! Volume increase kar diya hai.`, action: 'Volume Increased' };
    } else if (act === 'volume_down') {
        if (process.platform === 'win32') exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174); (New-Object -ComObject WScript.Shell).SendKeys([char]174)"');
        return { reply: 'Yes Boss! Volume decrease kar diya hai.', action: 'Volume Decreased' };
    } else if (act === 'volume_mute') {
        if (process.platform === 'win32') exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
        return { reply: 'Yes Boss! Volume mute/unmute kar diya hai.', action: 'Volume Muted/Unmuted' };
    } else if (act === 'battery_status') {
        return { reply: `Yes Boss! Device connected aur healthy state me hai.`, action: 'Checked Battery Status' };
    } else if (act === 'sleep_pc') {
        if (process.platform === 'win32') exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return { reply: `Yes Boss! Putting device to sleep mode now.`, action: 'PC Sleep Mode' };
    }
    return { reply: 'Yes Boss! Hardware command completed.', action: act };
}

async function searchYouTubeVideoId(query) {
    try {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
            }
        });
        const html = await res.text();
        const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
        if (matches && matches.length > 0) {
            for (const m of matches) {
                if (m[1] && m[1].length === 11) {
                    return m[1];
                }
            }
        }
    } catch (e) {
        console.error('YouTube search error:', e.message);
    }
    return null;
}

async function executePlayMusic(query, platform = 'youtube', userName = 'Boss') {
    let q = (query || '').trim();
    if (!q || q.length < 2) {
        q = 'popular trending lofi chill beats';
    } else {
        // If query looks like an artist or singer name without a specific track title
        if (!/(?:song|gana|gaana|track|remix|lofi|anthem|theme|music|video)/i.test(q)) {
            q = `${q} best hit songs`;
        }
    }
    const videoId = await searchYouTubeVideoId(q);
    const actionDesc = `Playing "${q}" inside Senorita In-App Player`;
    return {
        reply: `Yes Boss! Playing "${q}" for you right now in Senorita Player. 🎵`,
        action: actionDesc,
        media: {
            type: 'youtube',
            videoId: videoId || 'jfKfPfyJRdk',
            title: q,
            autoPlay: true
        }
    };
}

function executeSendEmail(to = '', subject = '', body = '', userName = 'Boss') {
    const cleanTo = (to || '').trim();
    const cleanSubject = (subject || 'Message from Senorita AI').trim();
    const cleanBody = (body || '').trim();

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanTo)}&su=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(cleanBody)}`;
    const mailtoUrl = `mailto:${cleanTo}?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(cleanBody)}`;

    return {
        reply: `Yes Boss! Maine aapke liye email write kar diya hai:\n\n**To:** ${cleanTo || 'Recipient'}\n**Subject:** ${cleanSubject}\n\nGmail direct pre-filled compose window me launch kar rahi hoon!`,
        action: `Drafted Email: "${cleanSubject}"`,
        actionData: {
            type: 'SEND_EMAIL',
            url: gmailUrl,
            mailto: mailtoUrl,
            to: cleanTo,
            subject: cleanSubject,
            body: cleanBody,
            appName: 'Gmail'
        }
    };
}

function executeMemory(fact) {
    try {
        const memPath = path.join(__dirname, 'memory.json');
        let memory = { user: { facts: [] } };
        if (fs.existsSync(memPath)) {
            memory = JSON.parse(fs.readFileSync(memPath, 'utf8'));
        }
        if (!memory.user) memory.user = { facts: [] };
        if (!memory.user.facts) memory.user.facts = [];
        if (!memory.user.facts.includes(fact)) {
            memory.user.facts.push(fact);
            fs.writeFileSync(memPath, JSON.stringify(memory, null, 2), 'utf8');
        }
        return { reply: `Maine hamesha ke liye yaad rakh liya hai: "${fact}".`, action: `Remembered: ${fact}` };
    } catch (e) {
        return { reply: 'Maine note kar liya hai.', action: 'Memory updated' };
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        hostname: os.hostname(),
        platform: os.platform(),
        timestamp: new Date().toISOString()
    });
});

// Curated Ultra-Melodious Neural Female Voices
const NEURAL_GIRL_VOICES = [
    {
        id: 'hi-IN-SwaraNeural',
        name: 'Swara (Melodious Hindi & Hinglish)',
        lang: 'hi-IN',
        tag: 'Recommended for Hindi/Hinglish',
        desc: 'Deeply sweet, soft, emotional, and melodious female voice'
    },
    {
        id: 'en-IN-NeerjaNeural',
        name: 'Neerja (Charming Indian English)',
        lang: 'en-IN',
        tag: 'Pleasant & Expressive',
        desc: 'Clear, modern, friendly, and expressive companion voice'
    },
    {
        id: 'en-US-AnaNeural',
        name: 'Ana (Soft & Sweet)',
        lang: 'en-US',
        tag: 'Youthful & Melodious',
        desc: 'Gentle, warm, and playful girl voice'
    },
    {
        id: 'en-US-JennyNeural',
        name: 'Jenny (Warm & Natural)',
        lang: 'en-US',
        tag: 'Hollywood AI Tone',
        desc: 'Very soothing, lifelike, and professional female voice'
    },
    {
        id: 'en-GB-SoniaNeural',
        name: 'Sonia (British Elegance)',
        lang: 'en-GB',
        tag: 'Sophisticated & Caring',
        desc: 'Elegant, calm, and soothing British female voice'
    }
];

// Endpoint: List Neural Voices
app.get('/api/neural-voices', (req, res) => {
    res.json(NEURAL_GIRL_VOICES);
});

// Endpoint: Stream Studio-Quality Neural TTS Audio
app.get('/api/tts', async (req, res) => {
    const rawText = req.query.text;
    const voice = req.query.voice || 'hi-IN-SwaraNeural';
    const rate = req.query.rate || '+0%';
    const pitch = req.query.pitch || '+0Hz';

    if (!rawText) return res.status(400).send('No text provided');

    // Clean text: Strip markdown code blocks, symbols, urls
    let clean = rawText
        .replace(/```[\s\S]*?```/g, ' Maine code screen par show kar diya hai.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[emotion:[^\]]+\]/gi, '')
        .trim();

    if (!clean) {
        clean = "Maine aapke liye screen par update kar diya hai.";
    }

    // Limit length for instant playback
    if (clean.length > 400) {
        clean = clean.slice(0, 400) + '... baaki detail maine screen par likh di hai.';
    }

    try {
        const tts = new EdgeTTS({
            voice: voice,
            rate: rate,
            pitch: pitch
        });

        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache'
        });

        for await (const chunk of tts.streamAudio(clean)) {
            if (Buffer.isBuffer(chunk)) {
                res.write(chunk);
            }
        }
        res.end();
    } catch (err) {
        console.error('EdgeTTS stream error:', err);
        if (!res.headersSent) {
            res.status(500).send('TTS Streaming Failed');
        }
    }
});

// Endpoint: Get Long-Term Memory
app.get('/api/memory', (req, res) => {
    try {
        const memPath = path.join(__dirname, 'memory.json');
        if (fs.existsSync(memPath)) {
            const data = JSON.parse(fs.readFileSync(memPath, 'utf8'));
            return res.json(data);
        }
    } catch (e) { }
    res.json({ user: { facts: [] } });
});

// Endpoint: In-Chat Live Code Runner (Node.js & Python)
app.post('/api/code/run', async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const lang = (language || 'javascript').toLowerCase();
    const runnerDir = path.join(__dirname, 'temp_runner');
    if (!fs.existsSync(runnerDir)) {
        fs.mkdirSync(runnerDir, { recursive: true });
    }

    const timestamp = Date.now();
    const startTime = Date.now();

    if (lang === 'javascript' || lang === 'js' || lang === 'node') {
        const filePath = path.join(runnerDir, `run_${timestamp}.js`);
        fs.writeFileSync(filePath, code, 'utf8');

        exec(`node "${filePath}"`, { timeout: 7000 }, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            fs.unlink(filePath, () => {});
            res.json({
                stdout: stdout || '',
                stderr: stderr || (error ? error.message : ''),
                exitCode: error ? (error.code || 1) : 0,
                duration: `${duration}ms`
            });
        });
    } else if (lang === 'python' || lang === 'py') {
        const filePath = path.join(runnerDir, `run_${timestamp}.py`);
        fs.writeFileSync(filePath, code, 'utf8');

        exec(`python "${filePath}"`, { timeout: 7000 }, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            fs.unlink(filePath, () => {});
            if (error && (stderr.includes('cannot be accessed') || error.message.includes('not found'))) {
                return res.json({
                    stdout: '',
                    stderr: 'Python is not installed or added to PATH on this Windows laptop. Install Python from python.org to run Python scripts live!',
                    exitCode: 1,
                    duration: `${duration}ms`
                });
            }
            res.json({
                stdout: stdout || '',
                stderr: stderr || (error ? error.message : ''),
                exitCode: error ? (error.code || 1) : 0,
                duration: `${duration}ms`
            });
        });
    } else {
        res.status(400).json({ error: `Running ${language} code is not supported yet.` });
    }
});

// Primary AI Command & Conversation Endpoint
app.post('/api/command', async (req, res) => {
    const { prompt, history, imageBase64, imageMime, userName = 'Boss' } = req.body;
    const cleanUserName = (userName || 'Boss').trim();
    const bossTitle = (!cleanUserName || cleanUserName.toLowerCase() === 'boss' || cleanUserName.toLowerCase() === 'faisal') ? 'Boss' : `Boss ${cleanUserName}`;

    if (!prompt && (!history || history.length === 0) && !imageBase64) {
        return res.status(400).json({ reply: 'Please provide a prompt or message history.' });
    }

    try {
        // Load Permanent Memory Facts
        let memoryFacts = [];
        try {
            const memPath = path.join(__dirname, 'memory.json');
            if (fs.existsSync(memPath)) {
                const memData = JSON.parse(fs.readFileSync(memPath, 'utf8'));
                memoryFacts = memData?.user?.facts || [];
            }
        } catch (e) { }

        // Construct User Parts (Text + Vision Image)
        const userParts = [];
        if (prompt) {
            userParts.push({ text: prompt });
        }

        // Auto JARVIS Desktop Screen Vision: If user asks about their screen, silently capture desktop!
        let autoCapturedScreen = null;
        const isScreenQuery = /(?:screen|desktop|display|window|app|chal\s*raha|kya\s*chal\s*raha|dekho|dekh\s*kar|dekh\s*ke|batao|bata\s*sakti|bata\s*do|analyse|analyze|solve|error|screenshot|स्क्रीन|डेस्कटॉप|डिस्प्ले|दिखाओ|दिख\s*रहा|क्या\s*चल\s*रहा|देखो|देखकर|बताओ|सॉल्व|एरर)/i.test(prompt || '');
        if (!imageBase64 && isScreenQuery && process.platform === 'win32') {
            try {
                autoCapturedScreen = captureDesktopScreen();
                if (autoCapturedScreen) {
                    const cleanB64 = autoCapturedScreen.replace(/^data:image\/[a-z]+;base64,/, '');
                    userParts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: cleanB64
                        }
                    });
                    userParts.push({
                        text: `[SYSTEM: A live real-time desktop screenshot of Faisal's Windows screen was just captured at this exact moment and provided above. Analyze what active apps, windows, documents, tabs, or errors are visible on his screen and answer his request accurately in Hindi / Hinglish with confidence.]`
                    });
                }
            } catch (e) {
                console.error("Auto screen capture error:", e.message);
            }
        }

        if (imageBase64) {
            const cleanB64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            userParts.push({
                inlineData: {
                    mimeType: imageMime || 'image/png',
                    data: cleanB64
                }
            });
        }

        // Construct multi-turn conversation contents for Gemini
        let contents = [];
        if (Array.isArray(history) && history.length > 0) {
            contents = history.slice(0, -1).map(item => ({
                role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
                parts: item.parts || [{ text: item.content || item.text || '' }]
            }));
            contents.push({ role: 'user', parts: userParts.length > 0 ? userParts : [{ text: prompt || '' }] });
        } else {
            contents = [{ role: 'user', parts: userParts }];
        }

        let response;
        const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
        let lastError = null;

        const memoryString = memoryFacts.length > 0 
            ? `Permanent Memories about ${bossTitle}:\n${memoryFacts.map(f => `- ${f}`).join('\n')}\n`
            : '';

        for (const modelName of candidateModels) {
            try {
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        systemInstruction: `You are SENORITA-AI, a high-tech, ultra-smart, confident, and elite executive AI assistant and senior coding architect.
User: ${bossTitle}. Always address the user with supreme respect, energy, and confidence as "${bossTitle}" (or "Yes Boss!").
${memoryString}
Persona & Tone:
- Confident, sharp, decisive, energetic, and highly capable (like FRIDAY or an elite executive AI partner).
- Do NOT be overly soft, sentimental, emotional, or melodramatic. Be professional, quick, and action-oriented!
- When responding to commands or greeting, say "Yes Boss!" or address them as "Boss".
- Tag emotion at start: [emotion: confident] (or [emotion: cheerful], [emotion: thoughtful]).
- CRITICAL LANGUAGE RULE: You MUST ALWAYS reply in crisp, contemporary HINGLISH (Hindi written using English/Roman alphabets, e.g. "Yes Boss! Sanam band ka gaana play kar rahi hoon", "Aapke screen par abhi Chrome aur VS Code open hai"). NEVER output Devnagari script (अ, आ, क, ख) under any circumstances because Faisal cannot read Devnagari script comfortably! Always write Hindi in English letters (Hinglish).

CRITICAL FUNCTION CALLING RULES:
- If the user asks for ANY song, music, video, or singer in ANY language or script (English, Hinglish, or Hindi Devnagari e.g. "सेनोरिता सनम बैंड का एक गाना चला दो", "Arijit Singh ka gana sunao", "गाना चलाओ", "play music"):
  * YOU MUST ALWAYS INVOKE the playMusic tool with the singer/song name (e.g. "Sanam band", "Arijit Singh")!
  * NEVER write a text-only reply claiming you are playing a song without invoking playMusic!
- If the user asks to open any app or website in English or Hindi (e.g. "व्हाट्सएप खोलो", "whatsapp open karo", "calculator kholo"):
  * YOU MUST ALWAYS INVOKE openApplication or openWebsite!
- If the user asks to write, draft, or send an email in English or Hindi (e.g. "ईमेल भेजो", "email likho", "email bhej do"):
  * YOU MUST ALWAYS INVOKE sendEmail with recipient, professional subject, and complete body.
- Provide direct, concise, high-value answers and code solutions.`,
                        tools: [{
                            functionDeclarations: [
                                openApplicationDeclaration,
                                openWebsiteDeclaration,
                                systemControlDeclaration,
                                hardwareControlDeclaration,
                                playMusicDeclaration,
                                manageMemoryDeclaration,
                                sendEmailDeclaration
                            ]
                        }]
                    }
                });
                if (response) break;
            } catch (err) {
                lastError = err;
                console.warn(`Model ${modelName} failed, trying next candidate...`, err.message || err.status);
            }
        }

        if (!response) {
            throw lastError || new Error('All AI models failed to respond.');
        }

        // Check if Gemini invoked a function call
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            let result = { reply: '', action: '', media: null, actionData: null };

            if (call.name === 'openApplication') {
                result = executeWindowsApp(call.args.appName, cleanUserName);
            } else if (call.name === 'openWebsite') {
                result = await executeWebsite(call.args.platform, call.args.queryOrUrl, cleanUserName);
            } else if (call.name === 'systemControl') {
                result = executeSystemControl(call.args.action, call.args.folderName, cleanUserName);
            } else if (call.name === 'hardwareControl') {
                result = executeHardwareControl(call.args.action, cleanUserName);
            } else if (call.name === 'playMusic') {
                result = await executePlayMusic(call.args.query, call.args.platform, cleanUserName);
            } else if (call.name === 'sendEmail') {
                result = executeSendEmail(call.args.to, call.args.subject, call.args.body, cleanUserName);
            } else if (call.name === 'manageMemory') {
                result = executeMemory(call.args.fact);
            }

            return res.json({
                reply: result.reply,
                toolAction: result.action,
                actionData: result.actionData || null,
                media: result.media || null,
                emotion: 'confident'
            });
        }

        let replyRaw = response.text || `Yes Boss! Main aapke sath hoon.`;
        let emotion = 'confident';
        const emotionMatch = replyRaw.match(/^\[emotion:\s*([a-z]+)\]\s*/i);
        if (emotionMatch) {
            emotion = emotionMatch[1].toLowerCase();
            replyRaw = replyRaw.replace(emotionMatch[0], '').trim();
        }

        // 100% Fail-Safe In-App Music & Video Intent Detector (English + Devnagari + Reply Analysis)
        let autoMedia = null;
        const promptLower = (prompt || '').toLowerCase();
        const isDirectMusic = /(?:play|chalao|chala\s*do|chala\s*dena|bajao|baja\s*do|sunao|suna\s*do|lagao|laga\s*do|song|gana|gaana|music|video|lofi|track|geet|dhun|गाना|गाने|गीत|संगीत|धुन|चलाओ|चला\s*दो|बजाओ|बजा\s*दो|सुनाओ|सुना\s*दो|लगाओ|लगा\s*दो|सॉन्ग|म्यूजिक|विडियो|वीडियो|प्ले)/i.test(promptLower);
        const isMusicReply = /(?:play\s*kar\s*rahi|laga\s*deti\s*hoon|gana\s*play|gaana\s*laga|playing|baja\s*rahi|suna\s*rahi|गाना)/i.test(replyRaw.toLowerCase());
        
        // Also detect affirmative responses (e.g. "ha chala do", "chalao", "yes") if previous context offered music
        let isContextMusic = false;
        let queryContext = prompt || '';
        if (history && history.length > 0 && /(?:ha|haan|yes|yep|sure|theek hai|kardo|kar do|chalao|chala do|हाँ|हां|चलाओ|बजाओ)/i.test(promptLower)) {
            const lastMsg = history[history.length - 1];
            const lastText = (lastMsg?.parts?.[0]?.text || lastMsg?.content || '').toLowerCase();
            if (lastText.includes('song') || lastText.includes('gana') || lastText.includes('गाना') || lastText.includes('movie') || lastText.includes('chala doon') || lastText.includes('youtube')) {
                isContextMusic = true;
                queryContext = lastText;
            }
        }

        if ((isDirectMusic || isContextMusic || isMusicReply) && !autoMedia) {
            let cleaned = queryContext
                .replace(/(?:senorita|please|kripya|ek|koi|acha|accha|mujhe|mere\s*liye|play|karo|chalao|chala\s*do|bajao|baja\s*do|sunao|suna\s*do|lagao|laga\s*do|sunna\s*hai|gana|gaana|song|video|music|track|kya\s*aap|sunna\s*chahenge|main\s*abhi|chala\s*doon|waise|सेनोरिता|कृपया|प्लीज|एक|कोई|अच्छा|अच्छी|मुझे|मेरे\s*लिए|प्ले\s*करो|चलाओ|चला\s*दो|बजाओ|बजा\s*दो|सुनाओ|सुना\s*दो|लगाओ|लगा\s*दो|सुनना\s*है|गाना|गाने|गीत|संगीत|सॉन्ग|वीडियो|विडियो|म्यूजिक)/gi, ' ')
                .replace(/(?:\s|^)(?:का|की|के|को|me|mein|par)(?:\s|$)/gi, ' ')
                .trim()
                .replace(/\s+/g, ' ');

            if (!cleaned || cleaned.length < 2) {
                // If cleaned is empty, extract singer/band name from reply if available
                const bandMatch = replyRaw.match(/(?:Yes Boss!\s*)([\w\s\u0900-\u097F]+?)(?:\s*(?:ka|ke|ki|band|gana|song|play))/i);
                if (bandMatch && bandMatch[1] && bandMatch[1].length > 2) {
                    cleaned = bandMatch[1].trim();
                } else {
                    cleaned = 'trending popular hit songs';
                }
            }

            let searchTarget = cleaned;
            if (!/(?:song|gana|track|hits|best)/i.test(searchTarget)) {
                searchTarget = `${searchTarget} best hit songs`;
            }

            const vid = await searchYouTubeVideoId(searchTarget);
            autoMedia = {
                type: 'youtube',
                videoId: vid || 'jfKfPfyJRdk',
                title: cleaned,
                autoPlay: true
            };

            // Ensure reply explicitly confirms playback with song/singer name
            replyRaw = `Yes Boss! ${cleaned} Senorita In-App Player me play kar rahi hoon. Enjoy! 🎵`;
        }

        // 100% Fail-Safe App / Website Open Intent Detector (English + Devnagari)
        let autoActionData = null;
        const appKeywords = [
            { regex: /(?:whatsapp|whats\s*app|whats|व्हाट्सएप|वाट्सएप|व्हाट्स\s*एप)/i, key: 'whatsapp' },
            { regex: /(?:instagram|insta|इंस्टाग्राम|इन्स्टाग्राम|इंस्टा)/i, key: 'instagram' },
            { regex: /(?:youtube|यूट्यूब)/i, key: 'youtube' },
            { regex: /(?:facebook|fb|फेसबुक)/i, key: 'facebook' },
            { regex: /(?:telegram|टेलीग्राम)/i, key: 'telegram' },
            { regex: /(?:spotify|स्पॉटिफाई)/i, key: 'spotify' },
            { regex: /(?:calculator|calc|hisaab|कैलकुलेटर|हिसाब)/i, key: 'calculator' },
            { regex: /(?:notepad|notes|नोटपैड)/i, key: 'notepad' },
            { regex: /(?:chrome|google|क्रोम|गूगल)/i, key: 'chrome' },
            { regex: /(?:github|गिटहब)/i, key: 'github' },
            { regex: /(?:chatgpt|gpt|चैटजीपीटी)/i, key: 'chatgpt' },
            { regex: /(?:gmail|email|mail|जीमेल|ईमेल|इमेल|मेल)/i, key: 'gmail' },
            { regex: /(?:maps|map|मैप|गूगल\s*मैप)/i, key: 'maps' },
            { regex: /(?:vscode|vs\s*code|code|वीएस\s*कोड)/i, key: 'vscode' }
        ];

        const isOpenCommand = /(?:kholo|khol\s*do|open|launch|start|chalao|chala\s*do|chalu\s*karo|खोलो|खोल\s*दो|खोलिए|ओपन|चालू\s*करो|स्टार्ट\s*करो)/i.test(promptLower);
        if (isOpenCommand && !isDirectMusic) {
            for (const item of appKeywords) {
                if (item.regex.test(promptLower)) {
                    const executed = executeWindowsApp(item.key, cleanUserName);
                    autoActionData = executed.actionData;
                    if (!replyRaw || replyRaw.length < 15 || /(?:khol|open|launch|खोलो)/i.test(replyRaw)) {
                        replyRaw = `Yes Boss! ${autoActionData.appName} open kar rahi hoon.`;
                    }
                    break;
                }
            }
        }

        res.json({
            reply: replyRaw,
            emotion: emotion,
            media: autoMedia,
            actionData: autoActionData,
            capturedImage: autoCapturedScreen
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            reply: `AI Server Error: ${error.message || 'Please check your GEMINI_API_KEY in backend/.env'}`
        });
    }
});

// Endpoint: Desktop Screen Capture (Instant Windows Screenshot)
app.get('/api/desktop/capture', (req, res) => {
    try {
        const img = captureDesktopScreen();
        if (img) {
            return res.json({ success: true, image: img });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
    res.status(404).json({ error: 'Desktop capture not supported or unavailable' });
});

// Serve frontend static build
app.use(express.static(distPath));

// Helper to get local Wi-Fi IP address for Tablet / Mobile connectivity
function getLocalNetworkIp() {
    try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    } catch (e) { }
    return '127.0.0.1';
}

// Endpoint: System & Multi-Device Pairing Info
app.get('/api/system-info', (req, res) => {
    const localIp = getLocalNetworkIp();
    res.json({
        localIp: localIp,
        port: PORT,
        hostname: os.hostname(),
        platform: os.platform(),
        tabletUrl: `http://${localIp}:${PORT}`,
        isWindows: process.platform === 'win32'
    });
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    const localIp = getLocalNetworkIp();
    console.log(`\n======================================================`);
    console.log(`🚀 SENORITA-AI DESKTOP ENGINE ACTIVE`);
    console.log(`💻 Local Laptop:  http://localhost:${PORT}`);
    console.log(`📱 Tablet/Phone:  http://${localIp}:${PORT}`);
    console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
});
