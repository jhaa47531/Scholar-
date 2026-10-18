import React from 'react';
import {
  GraduationCap,
  Users,
  Layers,
  Settings,
  BookOpen,
  History,
  ShieldCheck,
  Database,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';
import {
  AcademicSession,
  AuditLogEntry,
  CourseStructure,
  SessionalConfig,
  StudentProfile,
  SubjectMaster,
  TeacherProfile,
} from '../../types/domain.ts';

interface AdminOverviewProps {
  students: StudentProfile[];
  faculty: TeacherProfile[];
  courses: CourseStructure[];
  subjects: SubjectMaster[];
  configs: SessionalConfig[];
  auditLogs: AuditLogEntry[];
  sessions: AcademicSession[];
  onNavigate: (pageId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  students,
  faculty,
  courses,
  subjects,
  configs,
  auditLogs,
  sessions,
  onNavigate,
}) => {
  const activeSession = sessions.find((s) => s.isActive) || sessions[0];
  const activeConfigs = configs.filter((c) => c.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block mb-1">
            Academic Performance Governance
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Institutional Administration Overview
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Active session: <span className="text-slate-200 font-semibold">{activeSession?.title || 'Academic Year 2025-2026'}</span>.
            Managing {courses.length} degree programs, {subjects.length} curriculum subjects, and {students.length} enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('configs')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Configure Sessionals
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Assign Faculty
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ENROLLED STUDENTS"
          value={students.length}
          subtitle="Active academic year cohort"
          icon={GraduationCap}
          onClick={() => onNavigate('students')}
          badge="Enrolled"
        />
        <KpiCard
          title="FACULTY MEMBERS"
          value={faculty.length}
          subtitle="Department instructors & HODs"
          icon={Users}
          onClick={() => onNavigate('faculty')}
          badge="Verified"
        />
        <KpiCard
          title="DEGREE PROGRAMMES"
          value={courses.length}
          subtitle={`${subjects.length} curriculum subjects registered`}
          icon={Layers}
          onClick={() => onNavigate('courses')}
        />
        <KpiCard
          title="SESSIONAL CONFIGURATIONS"
          value={configs.length}
          subtitle={`${activeConfigs.length} active sessional exam tracks`}
          icon={Settings}
          onClick={() => onNavigate('configs')}
        />
      </div>

      {/* Two Column Layout: Quick Actions & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Administrative Navigation Cards */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
            System Administration
          </h2>

          <div className="space-y-2">
            {[
              {
                id: 'students',
                title: 'Student Roster & Cohorts',
                desc: 'Inspect enrollment numbers, roll numbers, and course placements.',
                icon: GraduationCap,
              },
              {
                id: 'faculty',
                title: 'Faculty & Department Records',
                desc: 'Manage teaching staff profiles and department assignments.',
                icon: Users,
              },
              {
                id: 'subjects',
                title: 'Curriculum & Subject Catalog',
                desc: 'Subject codes, credit allocations, and elective groupings.',
                icon: BookOpen,
              },
              {
                id: 'reports',
                title: 'Performance Reports & Eligibility',
                desc: 'Evaluate S1 and S2 overall completion criteria and GPA distributions.',
                icon: TrendingUp,
              },
              {
                id: 'audit',
                title: 'Compliance Audit Trail',
                desc: 'Review permanent logs of mark updates, configurations, and corrections.',
                icon: History,
              },
              {
                id: 'migration',
                title: 'Relational Database Migration',
                desc: 'Oracle schema mapping, table parity, and checksummed JSON exports.',
                icon: Database,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => onNavigate(card.id)}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{card.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Activity Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Recent Institutional Audit Activity
            </h2>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              View Full Log <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No audit activity logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-850/60 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {log.entityType}
                        </span>
                        <StatusBadge status={log.action} size="sm" />
                        <span className="text-xs text-slate-300 truncate font-medium">
                          {log.reason || 'System operation'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Actor: {log.actorId}</span>
                        <span>·</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
