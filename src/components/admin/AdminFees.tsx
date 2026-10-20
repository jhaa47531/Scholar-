import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  X,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  CourseFeeStructure,
  CourseStructure,
  FeePaymentStatus,
  StudentFeeRecord,
  StudentProfile,
  AcademicCycle,
} from '../../types/domain.ts';
import { KpiCard } from '../common/KpiCard.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminFeesProps {
  feeStructures: CourseFeeStructure[];
  studentFees: StudentFeeRecord[];
  students: StudentProfile[];
  courses: CourseStructure[];
  onRecordPayment: (payment: { studentId: string; amount: number; assessedSemester?: number; receiptNumber?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const AdminFees: React.FC<AdminFeesProps> = ({
  feeStructures,
  studentFees,
  students,
  courses,
  onRecordPayment,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Payment Recording Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentSemester, setPaymentSemester] = useState<number>(2);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // Aggregate Metrics
  const totalAssessed = useMemo(() => studentFees.reduce((acc, f) => acc + f.totalFee, 0), [studentFees]);
  const totalCollected = useMemo(() => studentFees.reduce((acc, f) => acc + f.paidAmount, 0), [studentFees]);
  const totalOutstanding = useMemo(() => studentFees.reduce((acc, f) => acc + f.balance, 0), [studentFees]);
  const collectionRate = totalAssessed > 0 ? (totalCollected / totalAssessed) * 100 : 0;

  // Filtered Student Fees
  const filteredFees = useMemo(() => {
    return studentFees.filter((f) => {
      const student = studentMap.get(f.studentId);
      const studentName = student?.name || '';
      const rollNo = student?.rollNo || '';
      const matchSearch =
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.receiptNumber && f.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCourse = selectedCourse === 'ALL' || f.courseId === selectedCourse;
      const matchStatus = selectedStatus === 'ALL' || f.status === selectedStatus;

      return matchSearch && matchCourse && matchStatus;
    });
  }, [studentFees, studentMap, searchTerm, selectedCourse, selectedStatus]);

  const handleOpenPayment = (studentId: string, currentBalance: number, assessedSem: number) => {
    setSelectedStudentForPayment(studentId);
    setPaymentAmount(currentBalance > 0 ? currentBalance.toString() : '32000');
    setPaymentSemester(assessedSem);
    setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment || !paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentError('Enter a valid positive payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);
    try {
      await onRecordPayment({
        studentId: selectedStudentForPayment,
        amount: Number(paymentAmount),
        assessedSemester: paymentSemester,
        receiptNumber: receiptNumber.trim() || undefined,
      });
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold block mb-1">
            Institutional Finance & Advance Fee Rules
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Fee Management & Advance Collection Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Enforces institutional advance fee rule:{' '}
            <span className="font-semibold text-slate-800">Fees are collected one semester in advance</span>.
            Odd semesters are billed in the <span className="font-semibold text-slate-800">December cycle</span> and
            even semesters in the <span className="font-semibold text-slate-800">June cycle</span>.
          </p>
        </div>

        <button
          onClick={() => {
            const firstStu = students[0]?.id || 'stu_aarav';
            handleOpenPayment(firstStu, 32000, 2);
          }}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          Record Student Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ASSESSED FEES"
          value={`₹${totalAssessed.toLocaleString('en-IN')}`}
          subtitle="Current semester + advance assessments"
          icon={Layers}
        />
        <KpiCard
          title="COLLECTED REVENUE"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subtitle={`${collectionRate.toFixed(1)}% recovery rate`}
          icon={CheckCircle2}
          trend={{ value: `${collectionRate.toFixed(0)}% recovery`, positive: collectionRate >= 70 }}
        />
        <KpiCard
          title="OUTSTANDING DUES"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          subtitle="Pending student fee balances"
          icon={Clock}
          trend={{ value: totalOutstanding > 0 ? 'Dues Pending' : 'Cleared', positive: totalOutstanding === 0 }}
        />
        <KpiCard
          title="ADVANCE FEE RULE"
          value="1 Sem Advance"
          subtitle="BCA, B.Tech, BBA, MCA, MBA"
          icon={FileCheck2}
          badge="Enforced"
        />
      </div>

      {/* Course Fee Structure Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
            Configured Course Fee Structures & Academic Cycles
          </h2>
          <span className="text-xs text-slate-500">
            {feeStructures.length} program fee schedules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {feeStructures.slice(0, 4).map((struct) => {
            const course = courseMap.get(struct.courseId);
            const isOddCycle = struct.academicCycle === AcademicCycle.ODD_DECEMBER;
            return (
              <div
                key={struct.id}
                className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{course?.courseCode || struct.courseId}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isOddCycle ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {isOddCycle ? 'Dec Cycle (Odd)' : 'June Cycle (Even)'}
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-indigo-600 font-mono tabular-nums">
                    ₹{struct.totalFee.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Semester {struct.semester} · Tuition ₹{struct.tuitionFee.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between font-mono">
                  <span>Advance Due: Sem {struct.advanceCollectionSemester}</span>
                  <span className="text-emerald-700 font-semibold">1 Sem Advance</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Fee Records Ledger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
            Student Fee Accounts & Clearance Ledger ({filteredFees.length})
          </h2>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, roll, or receipt..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value={FeePaymentStatus.PAID}>Paid</option>
              <option value={FeePaymentStatus.PARTIAL}>Partial</option>
              <option value={FeePaymentStatus.PENDING}>Pending</option>
              <option value={FeePaymentStatus.OVERDUE}>Overdue</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredFees.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Fee Records Match"
            description="No student fee entries found for the selected search and filter criteria."
          />
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Program & Sem</th>
                    <th className="py-3 px-4">Assessed Cycle</th>
                    <th className="py-3 px-4">Advance Fee Rule</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.map((fee) => {
                    const student = studentMap.get(fee.studentId);
                    const course = courseMap.get(fee.courseId);
                    const isOdd = fee.academicCycle === AcademicCycle.ODD_DECEMBER;

                    return (
                      <tr key={fee.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{student?.name || fee.studentId}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Roll: {student?.rollNo || 'N/A'} · {student?.enrollmentNo || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold text-slate-800">{course?.courseCode || fee.courseId}</span>
                          <span className="text-slate-500 ml-1">(Sem {fee.assessedSemester})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            isOdd ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {isOdd ? 'Dec Cycle (Odd)' : 'June Cycle (Even)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {fee.isAdvancePayment ? (
                            <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                              1 Sem in Advance
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Current Semester</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-800">
                          ₹{fee.totalFee.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-emerald-700 font-semibold">
                          ₹{fee.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                          {fee.balance > 0 ? (
                            <span className="text-rose-600 font-bold">₹{fee.balance.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">₹0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={fee.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenPayment(fee.studentId, fee.balance, fee.assessedSemester)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            {fee.balance === 0 ? 'Receipt' : 'Collect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Recording Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Institutional Fee Payment</h3>
                <p className="text-xs text-slate-500">Collect fees and generate verified receipt</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Student</label>
                <select
                  value={selectedStudentForPayment}
                  onChange={(e) => setSelectedStudentForPayment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNo} - {s.courseId.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Semester Assessed</label>
                  <select
                    value={paymentSemester}
                    onChange={(e) => setPaymentSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="1">Sem 1 (Dec cycle)</option>
                    <option value="2">Sem 2 (Advance / June cycle)</option>
                    <option value="3">Sem 3 (Advance / Dec cycle)</option>
                    <option value="4">Sem 4 (Advance / June cycle)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Advance Fee Collection Enforced
                </div>
                <p className="text-slate-600">
                  This transaction is written to the immutable audit log with administrator identity.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
