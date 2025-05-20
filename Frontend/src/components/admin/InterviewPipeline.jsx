import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, Plus, Trash2, ArrowUpDown, Check, X, Pencil, GripVertical, Save } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { JOB_API_END_POINT, PIPELINE_API_END_POINT } from '@/utils/constant';

const ROUND_TYPES = [
  { value: 'aptitude', label: 'Aptitude Test' },
  { value: 'technical', label: 'Technical Interview' },
  { value: 'hr', label: 'HR Interview' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'other', label: 'Other' }
];

const InterviewPipeline = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null); 
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // For adding/editing a round
  const [currentRound, setCurrentRound] = useState({
    name: '',
    description: '',
    type: 'technical',
    passingScore: 60
  });
  
  // For template selection
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Templates for quick setup
  const templates = [
    {
      id: 'template-tech-1',
      name: 'Standard Technical',
      description: '3-stage technical pipeline for engineers',
      rounds: [
        { name: 'Aptitude Screening', description: 'Basic aptitude test to assess problem-solving skills', type: 'aptitude', passingScore: 60 },
        { name: 'Technical Interview', description: 'In-depth technical assessment with senior engineers', type: 'technical' },
        { name: 'Cultural Fit', description: 'Final interview with team leads to assess team fit', type: 'hr' }
      ]
    },
    {
      id: 'template-tech-2',
      name: 'Extended Technical',
      description: '5-stage comprehensive pipeline for senior roles',
      rounds: [
        { name: 'Aptitude Screening', description: 'Initial problem-solving assessment', type: 'aptitude', passingScore: 70 },
        { name: 'Coding Challenge', description: 'Take-home coding assignment', type: 'assignment' },
        { name: 'Technical Round 1', description: 'Core skills assessment with team members', type: 'technical' },
        { name: 'Technical Round 2', description: 'Advanced concepts with senior engineers', type: 'technical' },
        { name: 'Leadership & Culture', description: 'Final round with leadership team', type: 'hr' }
      ]
    },
    {
      id: 'template-nontect',
      name: 'Non-Technical',
      description: 'For marketing, sales, and other non-technical roles',
      rounds: [
        { name: 'Initial Screening', description: 'Basic aptitude and domain knowledge assessment', type: 'aptitude', passingScore: 60 },
        { name: 'Domain Interview', description: 'Specific role-related skills assessment', type: 'other' },
        { name: 'Case Study', description: 'Practical problem-solving in the role context', type: 'assignment' },
        { name: 'HR & Culture', description: 'Team and company fit assessment', type: 'hr' }
      ]
    }
  ];

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });
      
      if (res.data.success) {
        setJob(res.data.job);
        // Initialize rounds if job has them, otherwise empty array
        if (res.data.job.interviewRounds && res.data.job.interviewRounds.length > 0) {
          setRounds(res.data.job.interviewRounds);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoundChange = (e) => {
    const { name, value } = e.target;
    setCurrentRound(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTypeChange = (value) => {
    setCurrentRound(prev => ({
      ...prev,
      type: value
    }));
  };

  const addNewRound = () => {
    // Reset current round
    setCurrentRound({
      name: '',
      description: '',
      type: 'technical',
      passingScore: 60
    });
    setIsEditing(true);
  };

  const editRound = (round) => {
    setCurrentRound({
      _id: round._id,
      name: round.name,
      description: round.description,
      type: round.type,
      passingScore: round.passingScore || 60
    });
    setIsEditing(true);
  };

  const saveRound = () => {
    if (!currentRound.name.trim()) {
      toast.error('Round name is required');
      return;
    }
    
    if (currentRound._id) {
      // Update existing round
      const updatedRounds = rounds.map(r => 
        r._id === currentRound._id ? { ...r, ...currentRound } : r
      );
      setRounds(updatedRounds);
    } else {
      // Add new round
      const newRound = {
        ...currentRound,
        _id: `temp-${Date.now()}`, // Temporary ID until saved to backend
        order: rounds.length + 1
      };
      setRounds([...rounds, newRound]);
    }
    
    setIsEditing(false);
    setCurrentRound({ name: '', description: '', type: 'technical', passingScore: 60 });
  };

  const deleteRound = (roundId) => {
    setRounds(rounds.filter(r => r._id !== roundId));
  };

  // Function to save the reordered rounds to the backend
  const saveReorderedRounds = async () => {
    try {
      // Only proceed if we have valid rounds with IDs
      const validRounds = rounds.filter(round => round._id && !round._id.toString().startsWith('temp-'));
      
      if (validRounds.length !== rounds.length) {
        toast.warning("Please save the pipeline first before reordering rounds");
        return false;
      }
      
      // Extract round IDs in the current order
      const roundIds = rounds.map(round => round._id.toString());
      
      // Send reorder request to backend
      const res = await axios.put(
        `${PIPELINE_API_END_POINT}/job/${jobId}/rounds/reorder`,
        { roundIds },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      
      if (res.data.success) {
        toast.success("Round order updated successfully");
        // Update rounds with the response data if available
        if (res.data.rounds) {
          setRounds(res.data.rounds);
        }
        return true;
      } else {
        toast.error(res.data.message || "Failed to update round order");
        return false;
      }
    } catch (error) {
      console.error("Error saving reordered rounds:", error);
      toast.error("Failed to update round order");
      return false;
    }
  };

  const applyTemplate = (template) => {
    setRounds(template.rounds.map((round, index) => ({
      ...round,
      _id: `temp-${Date.now()}-${index}`,
      order: index + 1
    })));
    setSelectedTemplate(template.id);
    toast.success(`Applied template: ${template.name}`);
  };

  const saveInterviewPipeline = async () => {
    if (rounds.length === 0) {
      toast.error('Please add at least one interview round');
      return;
    }

    try {
      setSaving(true);

      // Save job and rounds first if any round has a temp ID
      const hasTempRounds = rounds.some(r => r._id && r._id.startsWith('temp-'));
      let savedRounds = rounds;
      if (hasTempRounds) {
        // Save all rounds to backend and get real ObjectIds
        const res = await axios.put(
          `${PIPELINE_API_END_POINT}/job/${jobId}/interview-rounds`,
          { interviewRounds: rounds.map(({ _id, ...r }) => r) },
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
        if (res.data.success && res.data.job?.interviewRounds) {
          savedRounds = res.data.job.interviewRounds;
          setRounds(savedRounds);
        } else {
          toast.error('Failed to save interview rounds');
          setSaving(false);
          return;
        }
      }

      // Now create aptitude tests for rounds with valid ObjectId and no test
      const updatedRounds = await Promise.all(savedRounds.map(async (round) => {
        if (round.type === 'aptitude' && !round.aptitudeTest && round._id && !round._id.startsWith('temp-')) {
          try {
            const res = await axios.post(
              `${PIPELINE_API_END_POINT}/job/${jobId}/round/${round._id}/aptitude-test`,
              {
                title: `${round.name} Aptitude Test`,
                description: round.description || '',
                duration: 30,
                passingScore: round.passingScore || 60,
                questions: []
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
            if (res.data.success && res.data.aptitudeTest) {
              return { ...round, aptitudeTest: res.data.aptitudeTest._id };
            }
          } catch (err) {
            toast.error(`Failed to create aptitude test for round ${round.name}`);
          }
        }
        return round;
      }));
      setRounds(updatedRounds);

      toast.success('Interview pipeline saved successfully');
      navigate(`/admin/jobs/pipeline/${jobId}`);
    } catch (error) {
      console.error('Detailed error saving interview pipeline:', {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });

      let errorMessage = 'Failed to save pipeline';
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 500) {
          errorMessage = 'Server error - please try again later';
        }
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-10 px-4">
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
      <div className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(`/admin/jobs`)}
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job?.title} - Interview Pipeline</h1>
              <p className="text-gray-500 mt-1">Configure the interview process for this job opening</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/admin/jobs/pipeline/${jobId}/candidates`)}
              className="border-gray-200"
            >
              View Candidates
            </Button>
            <Button 
              onClick={saveInterviewPipeline}
              disabled={saving || rounds.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Pipeline
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Templates Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Setup Templates</h2>
          <p className="text-gray-500 mb-4">
            Choose a pre-defined template or create your own custom interview pipeline.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {templates.map(template => (
              <Card 
                key={template.id} 
                className={`border cursor-pointer transition-all hover:border-blue-400 hover:shadow-md ${
                  selectedTemplate === template.id ? 'border-blue-500 ring-2 ring-blue-100' : ''
                }`}
                onClick={() => applyTemplate(template)}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {template.rounds.map((round, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                          {idx + 1}
                        </span>
                        <span>{round.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyTemplate(template);
                    }}
                  >
                    Apply Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Interview Rounds Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Interview Rounds</h2>
            <Button 
              onClick={addNewRound}
              disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Round
            </Button>
          </div>

          {/* Edit Round Form */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6"
            >
              <h3 className="text-md font-medium text-gray-900 mb-4">
                {currentRound._id ? 'Edit Round' : 'Add New Round'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Round Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentRound.name}
                    onChange={handleRoundChange}
                    placeholder="e.g. Technical Interview"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={currentRound.description}
                    onChange={handleRoundChange}
                    placeholder="Describe what this round entails..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Round Type</Label>
                  <Select
                    value={currentRound.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue placeholder="Select round type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUND_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentRound.type === 'aptitude' && (
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      name="passingScore"
                      type="number"
                      min="1"
                      max="100"
                      value={currentRound.passingScore}
                      onChange={handleRoundChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Candidates must score at least this percentage to pass the aptitude test.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveRound}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentRound._id ? 'Update Round' : 'Add Round'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rounds List */}
          <div className="space-y-3 mt-6">
            {rounds.length === 0 && !isEditing ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No interview rounds configured yet. Add your first round or choose a template.</p>
              </div>
            ) : (
              <>
                {isReordering ? (
                  <Reorder.Group 
                    axis="y" 
                    values={rounds} 
                    onReorder={(newOrder) => {
                      // Update the order property for each round
                      const updatedRounds = newOrder.map((round, index) => ({
                        ...round,
                        order: index + 1
                      }));
                      setRounds(updatedRounds);
                    }}
                    className="space-y-3"
                  >
                    {rounds.map((round) => (
                      <Reorder.Item key={round._id} value={round} className="cursor-move">
                        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                            {round.order}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{round.name}</h4>
                            <p className="text-sm text-gray-500">
                              {ROUND_TYPES.find(t => t.value === round.type)?.label || round.type}
                            </p>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  <div className="space-y-3">
                    {rounds.map((round, index) => (
                      <div 
                        key={round._id} 
                        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{round.name}</h4>
                          <p className="text-sm text-gray-500">
                            {ROUND_TYPES.find(t => t.value === round.type)?.label || round.type}
                          </p>
                          {round.description && (
                            <p className="text-sm text-gray-500 mt-1">{round.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {round.type === 'aptitude' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-gray-200 hover:bg-blue-50" 
                              onClick={() => navigate(`/admin/jobs/pipeline/${jobId}/round/${round._id}/aptitude-test`)}
                            >
                              Configure Test
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-blue-600" 
                            onClick={() => editRound(round)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-600" 
                            onClick={() => deleteRound(round._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {rounds.length > 1 && (
              <div className="flex justify-center mt-4">
                {isReordering && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsReordering(false)}
                    className="ml-2 text-gray-500"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Tips for Setting Up Your Interview Pipeline</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-2 ml-2">
            <li>Start with an <strong>aptitude test</strong> for initial screening at scale</li>
            <li>Include rounds that specifically test for skills required in the job</li>
            <li>Keep your pipeline efficient - 3-5 rounds is typically sufficient</li>
            <li>For technical roles, consider including a practical coding assignment</li>
            <li>Always end with an HR/culture fit interview</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewPipeline; 