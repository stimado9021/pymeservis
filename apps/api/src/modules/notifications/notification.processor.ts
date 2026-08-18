import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ReminderService } from './reminder.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly reminders: ReminderService) {
    super();
  }

  async process(job: Job<{ reminderId?: string }>): Promise<void> {
    if (job.name === 'send' && job.data.reminderId) {
      await this.reminders.sendReminder(job.data.reminderId);
    }
    if (job.name === 'daily-maintenance') {
      const res = await this.reminders.runDailyMaintenance();
      console.log('[maintenance]', res);
    }
  }
}