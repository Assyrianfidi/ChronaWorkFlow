/**
 * Gamification Component
 * CEO Missions, Badges, Streaks, and Achievement Tracking
 */

import React from 'react';
import { Trophy, Target, Zap, Award, Star, Flame, TrendingUp, Users, Shield, Gift } from 'lucide-react';
import { Card, ProgressBar, Button } from './common';
import { mockMissions, mockBadges } from '../data';

export const GamificationDashboard: React.FC = () => {
  const currentStreak = 12;
  const totalXP = 2840;
  const nextLevelXP = 3000;
  const level = 8;

  return (
    <div className="space-y-6">
      {/* Level & XP Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-semibold">Level {level} CEO</p>
              <p className="text-3xl font-bold">{totalXP.toLocaleString()} XP</p>
              <p className="text-sm opacity-90">{nextLevelXP - totalXP} XP to Level {level + 1}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-semibold">{currentStreak} Day Streak</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar 
            value={totalXP} 
            max={nextLevelXP} 
            color="yellow"
            label={`Level ${level} Progress`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <Card title="CEO Missions" action={<span className="text-sm text-gray-500">3 of 5 complete</span>}>
          <div className="space-y-4">
            {mockMissions.map((mission) => (
              <div 
                key={mission.id} 
                className={`p-4 rounded-xl border ${mission.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${mission.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {mission.completed ? (
                      <Trophy className="w-5 h-5 text-green-600" />
                    ) : (
                      <Target className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${mission.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {mission.title}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${mission.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {mission.reward}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                    {!mission.completed && (
                      <div className="mt-3">
                        <ProgressBar 
                          value={mission.progress} 
                          max={mission.total} 
                          color="blue"
                          label={`${mission.progress} / ${mission.total}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Badges Collection */}
        <Card title="Achievement Badges" action={<span className="text-sm text-gray-500">{mockBadges.filter(b => b.earned).length} of {mockBadges.length} earned</span>}>
          <div className="grid grid-cols-3 gap-4">
            {mockBadges.map((badge) => (
              <div 
                key={badge.id} 
                className={`p-4 rounded-xl text-center border ${badge.earned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${badge.earned ? 'bg-yellow-100' : 'bg-gray-200'}`}>
                  {badge.icon === 'rocket' && <Zap className={`w-6 h-6 ${badge.earned ? 'text-yellow-600' : 'text-gray-400'}`} />}
                  {badge.icon === 'trending-up' && <TrendingUp className={`w-6 h-6 ${badge.earned ? 'text-yellow-600' : 'text-gray-400'}`} />}
                  {badge.icon === 'shield' && <Shield className={`w-6 h-6 ${badge.earned ? 'text-yellow-600' : 'text-gray-400'}`} />}
                  {badge.icon === 'users' && <Users className={`w-6 h-6 ${badge.earned ? 'text-yellow-600' : 'text-gray-400'}`} />}
                  {badge.icon === 'award' && <Award className={`w-6 h-6 ${badge.earned ? 'text-yellow-600' : 'text-gray-400'}`} />}
                </div>
                <p className={`text-sm font-medium ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</p>
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-gray-500 mt-1">Earned {badge.earnedAt}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Next Badge:</strong> Security Guardian - Enable MFA for all team members to unlock this achievement!
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Leaderboard / Stats */}
      <Card title="Weekly Performance Stats">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">+5</p>
            <p className="text-sm text-green-700">New Customers</p>
            <p className="text-xs text-gray-500">+500 XP</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">98%</p>
            <p className="text-sm text-blue-700">Uptime</p>
            <p className="text-xs text-gray-500">+200 XP</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">$12K</p>
            <p className="text-sm text-purple-700">Revenue</p>
            <p className="text-xs text-gray-500">+1000 XP</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <p className="text-3xl font-bold text-orange-600">0</p>
            <p className="text-sm text-orange-700">Churn</p>
            <p className="text-xs text-gray-500">+300 XP</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
