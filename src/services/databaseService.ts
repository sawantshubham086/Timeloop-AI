import { supabase } from '../lib/supabaseClient';
import { AnalysisResult } from '../types';

export class DatabaseService {
  /**
   * Save video metadata to database
   */
  static async saveVideo(
    title: string,
    fileSize: number,
    mimeType: string,
    durationSeconds: number,
    storagePath: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title,
        file_size: fileSize,
        mime_type: mimeType,
        duration_seconds: durationSeconds,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload video file to storage
   */
  static async uploadVideoFile(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('videos')
      .upload(fileName, file);

    if (error) throw error;
    return fileName;
  }

  /**
   * Get video file download URL
   */
  static async getVideoUrl(storagePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Save analysis result to database
   */
  static async saveAnalysis(
    videoId: string,
    masterPrompt: string,
    analysisResult: AnalysisResult
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('analyses')
      .insert({
        video_id: videoId,
        user_id: user.id,
        master_prompt: masterPrompt,
        analysis_json: analysisResult,
        segments: analysisResult.segments || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save generated image from product integration
   */
  static async saveGeneratedImage(
    analysisId: string,
    imageBase64: string,
    promptUsed: string,
    productImagePath?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        image_base64: imageBase64,
        prompt_used: promptUsed,
        product_image_path: productImagePath,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's videos
   */
  static async getUserVideos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get analyses for a video
   */
  static async getVideoAnalyses(videoId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get generated images for an analysis
   */
  static async getGeneratedImages(analysisId: string) {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get user profile
   */
  static async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user can upload (quota check)
   */
  static async canUploadVideo(): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile.videos_used < profile.videos_quota;
  }

  /**
   * Increment videos used count
   */
  static async incrementVideosUsed() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const profile = await this.getUserProfile();
    const { error } = await supabase
      .from('profiles')
      .update({ videos_used: profile.videos_used + 1 })
      .eq('id', user.id);

    if (error) throw error;
  }

  /**
   * Delete video and associated data
   */
  static async deleteVideo(videoId: string) {
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteError) throw deleteError;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: Record<string, any>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
