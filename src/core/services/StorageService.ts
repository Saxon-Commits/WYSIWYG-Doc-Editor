import { createClient } from '@supabase/supabase-js';
import { serializeDocument, deserializeDocument } from '../model/DocumentModel';
import type { DocumentModel } from '../model/DocumentModel';

// Ensure you have these in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class StorageService {
    async save(document: DocumentModel, title: string, id?: string): Promise<string> {
        const json = JSON.parse(serializeDocument(document)); // Convert string to object for JSONB

        const dataToSave = {
            title,
            content: json,
            updated_at: new Date().toISOString()
        };

        if (id) {
            // Update existing
            const { error } = await supabase
                .from('editor_documents')
                .update(dataToSave)
                .eq('id', id);

            if (error) throw error;
            return id;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('editor_documents')
                .insert([dataToSave])
                .select()
                .single();

            if (error) throw error;
            return data.id;
        }
    }

    async load(id: string): Promise<{ doc: DocumentModel, title: string } | null> {
        const { data, error } = await supabase
            .from('editor_documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Error loading doc:', error);
            return null;
        }

        // Parse the JSONB content back to our model
        const doc = deserializeDocument(JSON.stringify(data.content));
        return { doc, title: data.title };
    }
}

export const storageService = new StorageService();
