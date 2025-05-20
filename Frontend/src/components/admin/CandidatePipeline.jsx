import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Clock,
  MessageCircle,
  Search,
  Filter,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Users2 as Users2Icon,
  Edit2 as Edit2Icon,
  User2,
  Activity,
  CheckCircle2,
  Award,
  AlertCircle,
  X,
  ListFilter,
  MailIcon,
  BarChartIcon
} from 'lucide-react';
import { Eye as EyeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger
} from "../ui/dialog";
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT, PIPELINE_API_END_POINT } from '@/utils/constant';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Status badge colors
const StatusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  awaiting_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  passed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  hired: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  applied: "bg-purple-100 text-purple-800 border-purple-200",
  in_process: "bg-blue-100 text-blue-800 border-blue-200"
};

// Status label mapping
const StatusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  passed: "Passed",
  failed: "Failed",
  hired: "Hired",
  rejected: "Rejected",
  applied: "Applied",
  in_process: "In Process"
};

const CandidatePipeline = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // For candidate evaluation
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [evaluationStatus, setEvaluationStatus] = useState("passed");

  useEffect(() => {
    fetchJobAndCandidatesData();
  }, [jobId]);

  const fetchJobAndCandidatesData = async () => {
    setLoading(true);
    try {
      // Fetch job details
      const jobRes = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      if (jobRes.data.success) {
        setJob(jobRes.data.job);

        // Extract interview rounds
        if (jobRes.data.job.interviewRounds?.length > 0) {
          setRounds(jobRes.data.job.interviewRounds);
        } else {
          toast.warning('No interview rounds configured for this job');
          setRounds([]);
        }
      } else {
        toast.error(jobRes.data.message || 'Failed to load job data');
        setJob(null);
        setRounds([]);
      }

      // First fetch all applicants for this job
      const applicantsRes = await axios.get(`${APPLICATION_API_END_POINT}/${jobId}/applicants`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      // Then fetch candidates progress for this job
      const candidatesRes = await axios.get(`${PIPELINE_API_END_POINT}/job/${jobId}/candidates`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      // Combine data from both endpoints
      if (applicantsRes.data.success && candidatesRes.data.success) {
        const allApplicants = applicantsRes.data.applicants || [];
        const candidatesInPipeline = candidatesRes.data.candidatesProgress || [];

        // Create a map of candidates already in the pipeline
        const candidatesMap = new Map();
        candidatesInPipeline.forEach(candidate => {
          if (candidate.applicant && candidate.applicant._id) {
            candidatesMap.set(candidate.applicant._id.toString(), candidate);
          }
        });

        // Convert applicants to the same format as candidates in pipeline
        const applicantsFormatted = allApplicants.map(applicant => {
          // Check if this applicant is already in the pipeline
          const existingCandidate = candidatesMap.get(applicant.applicant._id.toString());

          if (existingCandidate) {
            return existingCandidate; // Use the existing pipeline data
          } else {
            // Create a new entry for applicants not yet in pipeline
            return {
              applicant: {
                _id: applicant.applicant._id,
                fullname: applicant.applicant.fullname,
                email: applicant.applicant.email,
                profilePhoto: applicant.applicant.profilePhoto
              },
              overallStatus: applicant.status || 'applied',
              currentRound: null,
              lastUpdated: applicant.createdAt,
              roundsStatus: [],
              applicationId: applicant._id
            };
          }
        });

        setCandidates(applicantsFormatted);
      } else {
        if (!applicantsRes.data.success) {
          toast.error(applicantsRes.data.message || 'Failed to load applicants data');
        }
        if (!candidatesRes.data.success) {
          toast.error(candidatesRes.data.message || 'Failed to load candidates data');
        }
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching job and candidates data:', error);
      toast.error('Failed to load data. Please try again.');
      setJob(null);
      setRounds([]);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCandidates = () => {
    return candidates.filter(candidate => {
      // Handle search term matching - check both fullname and fullName properties
      const matchesSearch = !searchTerm ||
        (candidate.applicant?.fullname && candidate.applicant.fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (candidate.applicant?.fullName && candidate.applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (candidate.applicant?.email && candidate.applicant.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Handle status filtering - include 'applied' status for candidates who just applied
      const matchesStatus = statusFilter === 'all' ||
        candidate.overallStatus === statusFilter ||
        (statusFilter === 'applied' && !candidate.overallStatus);

      // Handle round filtering - for candidates not in pipeline yet, they match 'all' filter
      const matchesRound = roundFilter === 'all' ||
        (candidate.currentRound && candidate.currentRound === roundFilter);

      return matchesSearch && matchesStatus && matchesRound;
    });
  };

  const hasPassedAptitudeTest = (candidate, roundId) => {
    if (!candidate || !candidate.roundsStatus || !Array.isArray(candidate.roundsStatus)) {
      return false;
    }

    const roundStatus = candidate.roundsStatus.find(rs =>
      rs && rs.round && String(rs.round) === String(roundId)
    );

    return roundStatus && roundStatus.status === 'passed';
  };

  const isReadyForEvaluation = (candidate, currentRound) => {
    if (!candidate || !currentRound) {
      return false;
    }

    if (currentRound.type !== 'aptitude') {
      return true;
    }

    return hasPassedAptitudeTest(candidate, currentRound._id);
  };

  const confirmAction = (actionType, candidateId, roundId = null) => {
    setSelectedCandidate(candidateId);
    if (roundId) setSelectedRound(roundId);
    setPendingAction(actionType);
    setActionDialogOpen(true);
  };

  const executePendingAction = async () => {
    if (!pendingAction || !selectedCandidate) return;

    try {
      let result;
      switch (pendingAction) {
        case 'accept':
        case 'reject':
          result = await finalizeCandidate(selectedCandidate, pendingAction);
          break;
        case 'pass':
        case 'fail':
          if (!selectedRound) throw new Error('No round selected');
          result = await evaluateCandidate(
            selectedCandidate,
            selectedRound,
            pendingAction === 'pass' ? 'passed' : 'failed'
          );
          break;
        default:
          throw new Error('Invalid action');
      }

      if (result?.success) {
        toast.success(`Action completed successfully`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error(error.message || 'Failed to complete action');
    } finally {
      setActionDialogOpen(false);
      setPendingAction(null);
      setSelectedCandidate(null);
      setSelectedRound(null);
    }
  };

  const evaluateCandidate = async (candidateId, roundId, status, score = null) => {
    try {
      const payload = {
        roundId,
        status,
        feedback: status === 'passed'
          ? 'Candidate passed this round'
          : 'Candidate did not meet requirements',
        ...(score !== null && { score })
      };

      console.log(`Evaluating candidate ${candidateId} for round ${roundId} with status: ${status}`);

      const res = await axios.put(
        `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (res.data.success) {
        // Get the round name for better feedback
        const currentRoundObj = rounds.find(r => r._id === roundId);
        const roundName = currentRoundObj ? currentRoundObj.name : 'this round';

        if (status === 'passed') {
          toast.success(`Candidate has passed ${roundName} and moved to the next stage.`);
        } else {
          toast.info(`Candidate has been marked as failed for ${roundName}.`);
        }

        // Refresh data to show updated status
        await fetchJobAndCandidatesData();

        const updatedCandidate = res.data.candidateProgress;
        const nextRound = rounds.find(r => r._id === updatedCandidate.currentRound);
        const isLastRound = currentRoundObj && currentRoundObj.order === rounds.length - 1;

        if (isLastRound && status === 'passed') {
          toast.info('Candidate has completed all rounds. You can now make a final decision.');
        } else if (nextRound && status === 'passed') {
          toast.info(`Candidate's next round is: ${nextRound.name}`);
        }

        return res.data;
      } else {
        throw new Error(res.data.message || 'Evaluation failed');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update candidate status');
      throw error;
    }
  };

  const finalizeCandidate = async (candidateId, status) => {
    try {
      const res = await axios.put(
        `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}/finalize`,
        {
          status: status === 'accept' ? 'hired' : 'rejected'
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        }
      );

      if (res.data.success) {
        if (status === 'accept') {
          toast.success('Candidate hired successfully!');
        } else {
          toast.success('Candidate rejected successfully!');
        }
        fetchJobAndCandidatesData();
        return res.data;
      } else {
        throw new Error(res.data.message || `Failed to ${status === 'accept' ? 'hire' : 'reject'} candidate`);
      }
    } catch (error) {
      console.error('Error finalizing candidate:', error);
      throw error;
    }
  };

  const sendEmailToCandidate = (candidate) => {
    const email = candidate.applicant?.email;
    if (email) {
      window.open(`mailto:${email}?subject=Regarding your application for ${job?.title}`, '_blank');
    } else {
      toast.error('No email address available for this candidate');
    }
  };

  const handleSavePipeline = async () => {
    const roundsToSave = rounds.map(round => {
      if (round.type === 'aptitude') {
        return {
          ...round,
          questions: []
        };
      }
      return round;
    });

    try {
      const res = await axios.put(
        `${JOB_API_END_POINT}/update/${jobId}`,
        {
          interviewRounds: roundsToSave
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!res.data.success) {
        toast.error(res.data.message || 'Failed to save pipeline');
        return;
      }

      const updatedRounds = res.data.job.interviewRounds || [];
      let createdTests = 0;

      for (const round of updatedRounds) {
        if (round.type === 'aptitude' && !round.aptitudeTest) {
          try {
            const testRes = await axios.post(
              `${PIPELINE_API_END_POINT}/job/${jobId}/round/${round._id}/aptitude-test`,
              {
                title: round.name || 'Untitled Aptitude Test',
                description: round.description || '',
                duration: 60,
                passingScore: round.passingScore || 60,
                questions: []
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (testRes.data.success) {
              createdTests++;
            }
          } catch (err) {
            console.error('Error creating aptitude test for round:', round._id, err);
          }
        }
      }

      toast.success(`Pipeline saved successfully${createdTests ? `. Created ${createdTests} aptitude test(s).` : ''}`);
      fetchJobAndCandidatesData();
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast.error('Failed to save pipeline. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-8 pb-16 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User2 className="h-6 w-6 text-blue-600" />
              Candidate Pipeline
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                {job?.title || 'Job Title'}
              </Badge>
              {job?.company?.name && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1">
                  {job?.company?.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => navigate(`/admin/jobs/edit/${jobId}`)}
            >
              <Edit2Icon className="h-4 w-4 mr-2" />
              Edit Job
            </Button>
          </div>
        </div>

        {/* Pipeline Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Total Candidates</CardTitle>
              <Users2Icon className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> In selection process
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-blue-800">In Progress</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {candidates.filter(c => c.overallStatus === 'in_process').length}
              </div>
              <p className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Currently being evaluated
              </p>
            </CardContent>
          </Card>

          <Card className="border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-green-800">Hired</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {candidates.filter(c => c.overallStatus === 'hired').length}
              </div>
              <p className="text-sm text-green-700 mt-1 flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Successfully completed all rounds
              </p>
            </CardContent>
          </Card>

          <Card className="border border-red-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-red-800">Rejected</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {candidates.filter(c => c.overallStatus === 'rejected').length}
              </div>
              <p className="text-sm text-red-700 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Did not meet requirements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                    placeholder="Search candidates by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]bg-white">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-gray-500" />
                        <SelectValue placeholder="Filter by status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="in_process">In Process</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={roundFilter} onValueChange={setRoundFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <ListFilter size={16} className="text-gray-500" />
                        <SelectValue placeholder="Filter by round" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rounds</SelectItem>
                      {rounds.map(round => (
                        <SelectItem key={round._id} value={round._id}>{round.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden mb-6">
          <CardHeader className="py-4 px-6 bg-white border-b border-gray-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-gray-900">Candidate Pipeline</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {getFilteredCandidates().length} Candidates
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-hidden">
            {getFilteredCandidates().length > 0 ? (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="py-3 px-6 font-semibold text-gray-900">Candidate</TableHead>
                    <TableHead className="py-3 px-6 font-semibold text-gray-900">Current Stage</TableHead>
                    <TableHead className="py-3 px-6 font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="py-3 px-6 font-semibold text-gray-900">Last Updated</TableHead>
                    <TableHead className="py-3 px-6 font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredCandidates().map((candidate, index) => {
                    const currentRound = rounds.find(r => r._id === candidate.currentRound);
                    const isLastRound = currentRound && currentRound.order === rounds.length - 1;

                    const roundStatus = candidate.roundsStatus && Array.isArray(candidate.roundsStatus)
                      ? candidate.roundsStatus.find(rs =>
                        rs && rs.round && String(rs.round) === String(candidate.currentRound)
                      )
                      : null;

                    const completedAllRounds = rounds.every(round => {
                      if (!candidate.roundsStatus || !Array.isArray(candidate.roundsStatus)) {
                        return false;
                      }
                      const roundStatusForIteration = candidate.roundsStatus.find(rs =>
                        rs && rs.round && String(rs.round) === String(round._id)
                      );
                      return roundStatusForIteration && roundStatusForIteration.status === 'passed';
                    });

                    const isActuallyDone = completedAllRounds ||
                      (isLastRound && roundStatus?.status === 'passed');

                    return (
                      <TableRow key={candidate.applicant?._id || index} className="hover:bg-gray-50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden">
                              {candidate.applicant?.profilePhoto ? (
                                <img
                                  src={candidate.applicant.profilePhoto}
                                  alt={candidate.applicant?.fullname || candidate.applicant?.fullName || 'Candidate'}
                                  className="h-full w-full object-cover transition-transform hover:scale-110"
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.applicant?.fullname || candidate.applicant?.fullName || 'Candidate')}&background=random&color=fff&size=128`;
                                  }}
                                />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-medium">
                                  {(candidate.applicant?.fullname?.[0] || candidate.applicant?.fullName?.[0] || 'C')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{candidate.applicant?.fullname || candidate.applicant?.fullName}</div>
                              <div className="text-sm text-gray-500">{candidate.applicant?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {currentRound ? (
                            <div className="flex items-center">
                              <span className="mr-2">Round {currentRound.order + 1}:</span>
                              <span className="font-medium">{currentRound.name}</span>
                              {roundStatus && (
                                <Badge className={`ml-2 ${StatusColors[roundStatus.status]}`}>
                                  {StatusLabels[roundStatus.status]}
                                </Badge>
                              )}
                              {isActuallyDone && (
                                <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                                  All Rounds Completed
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No current round</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${StatusColors[candidate.overallStatus] || StatusColors.applied} border`}>
                            {candidate.overallStatus ? StatusLabels[candidate.overallStatus] : 'Applied'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            {new Date(candidate.lastUpdated).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/jobs/${jobId}/candidates/${candidate.applicant?._id}`)}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  View Candidate
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => sendEmailToCandidate(candidate)}
                                    className="hover:text-green-600 hover:bg-green-50"
                                  >
                                    <MailIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Send Mail
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:text-orange-600 hover:bg-orange-50 hover:pla"
                                    onClick={() => navigate(`/admin/candidates/${candidate.applicant._id}/progress/${jobId}`)}
                                  >
                                    <BarChartIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  View Progress
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">No candidates found matching your filters.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Pipeline Visualization */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Pipeline Visualization</h2>

          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {rounds.map((round, index) => (
                <div key={round._id} className="min-w-[240px] max-w-[260px] relative group">
                  <div className="rounded-xl p-5 border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm transition-transform transform group-hover:-translate-y-1 group-hover:shadow-md duration-300">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow">
                        {index + 1}
                      </div>
                      <h3 className="ml-3 text-base font-semibold text-gray-800">{round.name}</h3>
                    </div>

                    <div className="text-sm text-gray-500 mb-4 capitalize tracking-wide">
                      {round.type}
                    </div>


                  </div>

                  {index < rounds.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition duration-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingAction} this candidate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant={pendingAction === 'accept' || pendingAction === 'pass' ? 'default' : 'destructive'}
              onClick={executePendingAction}
            >
              Confirm {pendingAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatePipeline;