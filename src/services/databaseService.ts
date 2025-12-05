import { supabase } from '../lib/supabaseClient';
import { AnalysisResult, UserSubscription, SubscriptionStatus, SubscriptionTier } from '../../types';

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

  // ==================== SUBSCRIPTION METHODS ====================

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  }

  /**
   * Create a new subscription record
   */
  static async createSubscription(
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly',
    razorpaySubscriptionId?: string,
    razorpayCustomerId?: string
  ): Promise<UserSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const startDate = new Date();
    const endDate = new Date();

    if (tier === SubscriptionTier.FREE_TRIAL) {
      // Free trial: 14 days
      endDate.setDate(endDate.getDate() + 14);
    } else if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier,
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        renewal_date: endDate.toISOString(),
        status: tier === SubscriptionTier.FREE_TRIAL ? 'on_trial' : 'active',
        razorpay_subscription_id: razorpaySubscriptionId,
        razorpay_customer_id: razorpayCustomerId,
        videos_used_this_month: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get subscription status for current user
   */
  static async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const subscription = await this.getUserSubscription();
    const profile = await this.getUserProfile();

    if (!subscription) {
      // No active subscription, return free trial if within 14 days of signup
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const isOnFreeTrial = daysElapsed <= 14;

      return {
        tier: SubscriptionTier.FREE_TRIAL,
        status: isOnFreeTrial ? 'on_trial' : 'expired',
        videosUsedThisMonth: profile.videos_used_this_month || 0,
        videoLimit: 5,
        daysRemaining: Math.max(0, 14 - daysElapsed),
      };
    }

    const renewalDate = new Date(subscription.renewal_date);
    const now = new Date();
    const daysRemaining = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      tier: subscription.tier,
      status: subscription.status,
      videosUsedThisMonth: subscription.videos_used_this_month,
      videoLimit: this.getVideoLimitForTier(subscription.tier),
      daysRemaining: Math.max(0, daysRemaining),
      renewalDate: subscription.renewal_date,
      nextBillingDate: subscription.renewal_date,
    };
  }

  /**
   * Get video limit for a subscription tier
   */
  static getVideoLimitForTier(tier: SubscriptionTier): number {
    switch (tier) {
      case SubscriptionTier.FREE_TRIAL:
        return 5;
      case SubscriptionTier.BASIC:
        return 50;
      case SubscriptionTier.PREMIUM:
        return 999999; // Unlimited
      default:
        return 5;
    }
  }

  /**
   * Check if user can upload a video
   */
  static async canUploadVideo(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.videosUsedThisMonth < status.videoLimit;
  }

  /**
   * Increment videos used this month
   */
  static async incrementVideosUsedThisMonth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const subscription = await this.getUserSubscription();
    if (subscription) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ videos_used_this_month: subscription.videos_used_this_month + 1 })
        .eq('id', subscription.id);
      if (error) throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const subscription = await this.getUserSubscription();
    if (!subscription) throw new Error('No active subscription to cancel');

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription.id);

    if (error) throw error;
  }

  /**
   * Reset videos count at month start
   */
  static async resetMonthlyVideoCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('subscriptions')
      .update({ videos_used_this_month: 0 })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) throw error;
  }
}
