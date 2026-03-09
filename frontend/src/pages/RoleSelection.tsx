import { User, GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router";

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#6366F1] flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <BookOpen className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Academic Risk Early-Warning System
          </h1>
          <p className="text-xl text-white/80">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Student Card */}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-white rounded-2xl p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-[#2563EB]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Access your personal dashboard, track tasks, view risk analysis, and get personalized recommendations
              </p>
              <ul className="space-y-2 text-sm text-gray-600 w-full">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Track assignments and deadlines</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>View your risk level and explanations</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Get personalized recovery plans</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Simulate what-if scenarios</span>
                </li>
              </ul>
            </div>
          </button>

          {/* Faculty Card */}
          <button
            onClick={() => navigate("/faculty/dashboard")}
            className="bg-white rounded-2xl p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-[#9333EA]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Faculty</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Monitor all students, view class-wide analytics, generate reports, and identify at-risk students
              </p>
              <ul className="space-y-2 text-sm text-gray-600 w-full">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Monitor all student risk levels</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>View class-wide analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Generate comprehensive reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span>Identify intervention priorities</span>
                </li>
              </ul>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-12">
          &copy; 2026 Academic Risk Early-Warning System | Version 1.1.0
        </p>
      </div>
    </div>
  );
}
