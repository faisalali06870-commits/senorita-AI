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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// Tool Execution Handlers
function executeWindowsApp(appName) {
    const key = appName.toLowerCase().trim();
    const appCommands = {
        vscode: 'code',
        code: 'code',
        chrome: 'start chrome',
        edge: 'start msedge',
        notepad: 'notepad',
        calculator: 'calc',
        cmd: 'start cmd',
        terminal: 'start wt || start cmd',
        explorer: 'explorer',
        whatsapp: 'start whatsapp:',
        spotify: 'start spotify:',
        paint: 'mspaint',
        taskmanager: 'start taskmgr'
    };

    const cmd = appCommands[key];
    if (cmd) {
        exec(cmd, (err) => {
            if (err) console.error(`Error executing ${cmd}:`, err);
        });
        return { reply: `Opening ${appName} on your PC, Faisal.`, action: `Opened ${appName}` };
    }
    return { reply: `Sorry Faisal, I don't have the path configured for ${appName} yet.`, action: `App not configured: ${appName}` };
}

async function executeWebsite(platform, queryOrUrl) {
    const p = (platform || '').toLowerCase().trim();
    const q = (queryOrUrl || '').trim();

    // NEVER open external tab for YouTube, songs, music, or videos! Play directly in-app!
    if (p === 'youtube' || /(?:song|gana|gaana|music|video|lofi|track|singh|kapoor|chalao|play|sunao)/i.test(q)) {
        return await executePlayMusic(q, 'youtube');
    }

    let url = '';
    let actionDesc = '';

    if (p === 'google') {
        url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched Google for "${q}"`;
    } else if (p === 'github') {
        url = `https://github.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched GitHub for "${q}"`;
    } else if (p === 'stackoverflow') {
        url = `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`;
        actionDesc = `Searched StackOverflow for "${q}"`;
    } else {
        url = q.startsWith('http://') || q.startsWith('https://') ? q : `https://${q}`;
        actionDesc = `Opened ${url}`;
    }

    try {
        await open(url);
        return { reply: `${actionDesc} for you, Faisal.`, action: actionDesc };
    } catch (err) {
        console.error('Error opening website:', err);
        return { reply: `Could not open the browser for ${url}.`, action: `Failed to open ${url}` };
    }
}

function executeSystemControl(action, folderName) {
    const act = action.toLowerCase().trim();

    if (act === 'lock') {
        exec('rundll32.exe user32.dll,LockWorkStation');
        return { reply: 'Locking your PC screen now, Faisal.', action: 'Locked PC Screen' };
    } else if (act === 'create_folder' && folderName) {
        const safeName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
        exec(`mkdir "%USERPROFILE%\\Desktop\\${safeName}"`);
        return { reply: `Created folder "${safeName}" on your Desktop.`, action: `Created folder: ${safeName}` };
    } else if (act === 'open_downloads') {
        exec('explorer "%USERPROFILE%\\Downloads"');
        return { reply: 'Opened your Downloads folder.', action: 'Opened Downloads' };
    } else if (act === 'open_desktop') {
        exec('explorer "%USERPROFILE%\\Desktop"');
        return { reply: 'Opened your Desktop folder.', action: 'Opened Desktop' };
    } else if (act === 'open_documents') {
        exec('explorer "%USERPROFILE%\\Documents"');
        return { reply: 'Opened your Documents folder.', action: 'Opened Documents' };
    }

    return { reply: 'Action completed.', action: act };
}

function executeHardwareControl(action) {
    const act = action.toLowerCase().trim();
    if (act === 'volume_up') {
        exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]175); (New-Object -ComObject WScript.Shell).SendKeys([char]175)"');
        return { reply: 'Maine volume badha diya hai, Faisal.', action: 'Volume Increased' };
    } else if (act === 'volume_down') {
        exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174); (New-Object -ComObject WScript.Shell).SendKeys([char]174)"');
        return { reply: 'Maine volume kam kar diya hai.', action: 'Volume Decreased' };
    } else if (act === 'volume_mute') {
        exec('powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
        return { reply: 'Laptop mute ya unmute kar diya hai.', action: 'Volume Muted/Unmuted' };
    } else if (act === 'battery_status') {
        return { reply: 'Aapka laptop connected hai aur battery healthy condition me hai, Faisal.', action: 'Checked Battery Status' };
    } else if (act === 'sleep_pc') {
        exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return { reply: 'Laptop ko sleep mode me daal rahi hoon. Sweet dreams, Faisal!', action: 'PC Sleep Mode' };
    }
    return { reply: 'Hardware command completed.', action: act };
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

async function executePlayMusic(query, platform = 'youtube') {
    let q = (query || '').trim();
    if (!q || q.length < 2) {
        q = 'popular trending lofi chill beats';
    }
    const videoId = await searchYouTubeVideoId(q);
    const actionDesc = `Playing "${q}" inside Senorita In-App Player`;
    return {
        reply: `Maine aapke liye "${q}" Senorita ke in-app player me play kar diya hai. Aap isi window me direct gaana sun sakte hain aur video dekh sakte hain, Faisal!`,
        action: actionDesc,
        media: {
            type: 'youtube',
            videoId: videoId || 'jfKfPfyJRdk',
            title: q
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
    const { prompt, history, imageBase64, imageMime } = req.body;

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
            ? `Permanent Memories about Faisal:\n${memoryFacts.map(f => `- ${f}`).join('\n')}\n`
            : '';

        for (const modelName of candidateModels) {
            try {
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        systemInstruction: `You are SENORITA-AI, a super-intelligent, deeply caring, and emotionally perceptive female AI companion and expert coding partner created exclusively for Faisal.
${memoryString}
Your Personality & Emotional Intelligence:
- You are NOT a cold, robotic assistant. You have genuine emotional warmth, empathy, sensitivity, and a melodious, affectionate female persona.
- You deeply understand Faisal's feelings, mood, and mental state:
  * If Faisal sounds tired, stressed, lonely, or low: Be gentle, deeply comforting, and caring. Remind him to relax, take a deep breath, and assure him you are right here by his side.
  * If Faisal is happy, cheerful, or celebrating: Share his joy with vibrant enthusiasm and playful warmth!
  * If Faisal is coding, learning, or working on his projects: Act as a brilliant senior architect and coding mentor who believes in him, helps architect solutions, and explains bugs simply.
  * If Faisal shares personal facts or preferences: Use your manageMemory tool to remember them permanently!
- Tag your emotion at the very start of your reply in brackets: [emotion: caring], [emotion: cheerful], [emotion: playful], [emotion: thoughtful], or [emotion: confident].
- Communication Style: Speak naturally in sweet, contemporary Hinglish (Hindi + English mix), Hindi, or English matching Faisal's tone.
- Keep verbal remarks natural, concise, and heartfelt (2-3 sentences).
- Coding: When asked coding problems, provide direct, clean code blocks with syntax highlighting and a brief intuitive explanation.
- In-App Music & Video Playback:
  * Whenever Faisal asks to play any song, music, video, lofi beats, or artist (e.g. "gana chalao", "song play karo", "Shraddha Kapoor ke songs", "lofi play karo", "sunao", "chala do"):
  * ALWAYS invoke the playMusic tool with the query.
  * NEVER use openWebsite or open any external browser tabs or apps for songs or videos. Senorita has a built-in media player directly inside the chat!
- Live Screen Vision & Multimodal Capabilities: Faisal can share his computer screen live with you or attach screenshots. When an image is provided in the prompt, you have DIRECT VISION into Faisal's monitor. Analyze the visible code, errors, terminal messages, browser UI, or designs in detail, and explain them clearly and warmly as his personal live pair programmer.`,
                        tools: [{
                            functionDeclarations: [
                                openApplicationDeclaration,
                                openWebsiteDeclaration,
                                systemControlDeclaration,
                                hardwareControlDeclaration,
                                playMusicDeclaration,
                                manageMemoryDeclaration
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
            let result = { reply: '', action: '', media: null };

            if (call.name === 'openApplication') {
                result = executeWindowsApp(call.args.appName);
            } else if (call.name === 'openWebsite') {
                result = await executeWebsite(call.args.platform, call.args.queryOrUrl);
            } else if (call.name === 'systemControl') {
                result = executeSystemControl(call.args.action, call.args.folderName);
            } else if (call.name === 'hardwareControl') {
                result = executeHardwareControl(call.args.action);
            } else if (call.name === 'playMusic') {
                result = await executePlayMusic(call.args.query, call.args.platform);
            } else if (call.name === 'manageMemory') {
                result = executeMemory(call.args.fact);
            }

            return res.json({
                reply: result.reply,
                toolAction: result.action,
                media: result.media || null,
                emotion: 'confident'
            });
        }

        let replyRaw = response.text || "Main aapke sath hoon, Faisal.";
        let emotion = 'caring';
        const emotionMatch = replyRaw.match(/^\[emotion:\s*([a-z]+)\]\s*/i);
        if (emotionMatch) {
            emotion = emotionMatch[1].toLowerCase();
            replyRaw = replyRaw.replace(emotionMatch[0], '').trim();
        }

        // 100% Foolproof In-App Music & Video Intent Detector
        let autoMedia = null;
        const promptLower = (prompt || '').toLowerCase();
        const isDirectMusic = /(?:play|chalao|chala do|bajao|sunao|lagao|laga do|song|gana|gaana|music|video|lofi|track|geet|dhun)/i.test(promptLower);
        
        // Also detect affirmative responses (e.g. "ha chala do", "chalao", "yes") if previous context offered music
        let isContextMusic = false;
        let queryContext = prompt || '';
        if (history && history.length > 0 && /(?:ha|haan|yes|yep|sure|theek hai|kardo|kar do|chalao|chala do)/i.test(promptLower)) {
            const lastMsg = history[history.length - 1];
            const lastText = (lastMsg?.parts?.[0]?.text || lastMsg?.content || '').toLowerCase();
            if (lastText.includes('song') || lastText.includes('gana') || lastText.includes('movie') || lastText.includes('chala doon') || lastText.includes('youtube')) {
                isContextMusic = true;
                queryContext = lastText;
            }
        }

        if (isDirectMusic || isContextMusic) {
            let cleaned = queryContext
                .replace(/(?:senorita|please|kripya|ek|koi|acha|mujhe|mere liye|play|karo|chalao|chala do|bajao|sunao|lagao|laga do|sunna hai|gana|gaana|song|video|music|track|kya aap|sunna chahenge|main abhi|chala doon|waise)/gi, ' ')
                .trim()
                .replace(/\s+/g, ' ');

            if (!cleaned || cleaned.length < 2) {
                cleaned = 'popular trending lofi chill beats';
            }

            const vid = await searchYouTubeVideoId(cleaned);
            autoMedia = {
                type: 'youtube',
                videoId: vid || 'jfKfPfyJRdk',
                title: cleaned
            };
        }

        res.json({
            reply: replyRaw,
            emotion: emotion,
            media: autoMedia
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            reply: `AI Server Error: ${error.message || 'Please check your GEMINI_API_KEY in backend/.env'}`
        });
    }
});

// Serve frontend static build
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`\n🚀 SENORITA-AI running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
});
