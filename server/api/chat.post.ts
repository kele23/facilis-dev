import { defineEventHandler, readBody, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../utils/auth.ts';
import { useCouchAdmin } from '../utils/couch.ts';
import { decryptToken } from '../utils/crypto.ts';
import { getAIProvider } from '../utils/ai.ts';
import { useStorage } from 'nitro/storage';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    const body = await readBody<{
        projectId?: string;
        messages?: any[];
        model?: string;
        files?: { name: string; content: string }[];
    }>(event);

    if (!body?.projectId || !body?.messages) {
        throw new HTTPError('projectId and messages are required', {
            status: 400,
        });
    }

    const couch = useCouchAdmin(user.name, event);

    let projectDoc: any;
    try {
        projectDoc = await couch.request<any>(
            `/facilis-projects/${body.projectId}`,
        );
    } catch (err: any) {
        throw new HTTPError('Project not found', { status: 404 });
    }

    if (!projectDoc.developers?.includes(user.name)) {
        throw new HTTPError(
            'Only developers can interact with the AI in this project',
            { status: 403 },
        );
    }

    if (!projectDoc.aiToken || !projectDoc.aiProvider) {
        throw new HTTPError('AI API Token not configured in project settings', {
            status: 400,
        });
    }

    const decryptedToken = decryptToken(projectDoc.aiToken);
    if (!decryptedToken) {
        throw new HTTPError('Failed to decrypt AI API Token', { status: 500 });
    }

    const provider = projectDoc.aiProvider.toLowerCase();
    let model = body.model || '';

    if (provider === 'gemini') {
        model = model || 'gemini-flash-latest';
    } else if (provider === 'openai') {
        model = model || 'gpt-4.5-turbo';
    } else if (provider === 'openrouter') {
        model = model || 'anthropic/claude-3.7-sonnet';
    }

    const aiProvider = getAIProvider(provider);

    // Resolve system prompt
    let systemPrompt = projectDoc.systemPrompt;
    if (!systemPrompt) {
        try {
            const storage = useStorage('assets:server');
            const asset = await storage.getItem('prompts/default_system.md');
            systemPrompt = asset?.toString() || '';
        } catch (e) {
            console.error('Failed to load default system prompt asset', e);
            // Last resort fallback
            systemPrompt =
                'You are facilis.dev AI, an expert web developer specializing in rapid prototyping. Goal: Help build an application.';
        }
    }

    // Prepare project context if files are provided
    let projectContext = '';
    if (body.files && body.files.length > 0) {
        projectContext =
            '\n\nCURRENT PROJECT FILES CONTEXT:\n' +
            body.files
                .map((f) => `--- File: ${f.name} ---\n${f.content}\n---`)
                .join('\n') +
            '\n\nUse the above files as your current codebase context.';
    }

    try {
        const messages = [
            { role: 'system', content: systemPrompt + projectContext },
            ...(body.messages || []),
        ];

        const replyContent = await aiProvider.chat({
            model,
            messages,
            token: decryptedToken,
        });

        // Process response...

        // Ritorna la risposta mappata nello standard OpenAI
        // così il frontend (ProjectView.vue) non deve cambiare la sua implementazione.
        return {
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: replyContent,
                    },
                },
            ],
        };
    } catch (err: any) {
        if (err.statusCode || err.status) throw err;
        throw new HTTPError('Internal communication error with AI API', {
            status: 500,
        });
    }
});
