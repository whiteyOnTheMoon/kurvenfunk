import { BullModule } from '@nestjs/bullmq';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APPLICATION_QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '@kurvenfunk/types';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { validateEnvironment } from './config/env.validation';
import { AdminModule } from './modules/admin/admin.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BansModule } from './modules/bans/bans.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { ForumsModule } from './modules/forums/forums.module';
import { HealthModule } from './modules/health/health.module';
import { ImportsModule } from './modules/imports/imports.module';
import { MatchesModule } from './modules/matches/matches.module';
import { MediaModule } from './modules/media/media.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PersonalizationModule } from './modules/personalization/personalization.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RequestIdTestModule } from './modules/request-id-test/request-id-test.module';
import { SanctionsModule } from './modules/sanctions/sanctions.module';
import { SearchModule } from './modules/search/search.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { StandingsModule } from './modules/standings/standings.module';
import { TagsModule } from './modules/tags/tags.module';
import { ThreadsModule } from './modules/threads/threads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    BullModule.registerQueue(
      ...APPLICATION_QUEUE_NAMES.map((name) => ({
        name,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),

    AuthModule,
    PermissionsModule,
    UsersModule,
    ProfilesModule,
    OnboardingModule,
    PersonalizationModule,

    ClubsModule,
    CompetitionsModule,
    SeasonsModule,
    MatchesModule,
    StandingsModule,

    ArticlesModule,
    CategoriesModule,
    TagsModule,
    MediaModule,

    CommentsModule,
    ReactionsModule,
    ReportsModule,

    ForumsModule,
    ThreadsModule,
    PostsModule,

    NotificationsModule,
    ModerationModule,
    SanctionsModule,
    BansModule,
    AuditModule,

    ImportsModule,
    ProvidersModule,
    SearchModule,

    AdminModule,

    HealthModule,
    RequestIdTestModule.register(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
