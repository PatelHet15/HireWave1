import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import { setInterviewTemplates, setCurrentTemplate, updateApplicantStatus } from '@/Redux/ApplicationSlice';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const InterviewManagement = () => {
  const handleEditTemplate = (templateId) => {
    const template = interviewTemplates.find(t => t._id === templateId);
    if (template) {
      setFormData(template);
      setShowTemplateForm(true);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await axios.delete(`/api/interview-templates/${templateId}`);
      dispatch(setInterviewTemplates(interviewTemplates.filter(t => t._id !== templateId)));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };
  const dispatch = useDispatch();
  const { interviewTemplates, currentTemplate } = useSelector(state => state.application);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rounds: []
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get('/api/interview-templates');
        dispatch(setInterviewTemplates(res.data));
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, [dispatch]);

  const handleAddRound = () => {
    setFormData(prev => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          name: '',
          order: prev.rounds.length + 1,
          type: 'technical',
          aptitudeQuestions: []
        }
      ]
    }));
  };

  const handleRoundChange = (index, field, value) => {
    const newRounds = [...formData.rounds];
    newRounds[index][field] = value;
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  const handleAddQuestion = (roundIndex) => {
    const newRounds = [...formData.rounds];
    if (!newRounds[roundIndex].aptitudeQuestions) {
      newRounds[roundIndex].aptitudeQuestions = [];
    }
    newRounds[roundIndex].aptitudeQuestions.push({
      question: '',
      options: ['', '', '', ''],
      correctOption: 0
    });
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  const handleQuestionChange = (roundIndex, questionIndex, field, value) => {
    const newRounds = [...formData.rounds];
    if (field === 'option') {
      const [_, optionIndex] = value;
      newRounds[roundIndex].aptitudeQuestions[questionIndex].options[optionIndex] = value;
    } else {
      newRounds[roundIndex].aptitudeQuestions[questionIndex][field] = value;
    }
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/interview-templates', formData);
      dispatch(setInterviewTemplates([...interviewTemplates, res.data]));
      setShowTemplateForm(false);
      setFormData({ name: '', description: '', rounds: [] });
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateApplicantStatus = async (applicantId, status, currentRound, roundProgress) => {
    try {
      await axios.put(`/api/applications/${applicantId}/status`, {
        status,
        currentRound,
        roundProgress
      });
      dispatch(updateApplicantStatus({ applicantId, status, currentRound, roundProgress }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Interview Management</h1>
        <button
          onClick={() => setShowTemplateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Create Template
        </button>
      </div>

      {showTemplateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Interview Rounds</h3>
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <FaPlus /> Add Round
                </button>
              </div>

              {formData.rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="border rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Round Name</label>
                      <input
                        type="text"
                        value={round.name}
                        onChange={(e) => handleRoundChange(roundIndex, 'name', e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Round Type</label>
                      <select
                        value={round.type}
                        onChange={(e) => handleRoundChange(roundIndex, 'type', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="aptitude">Aptitude</option>
                        <option value="technical">Technical</option>
                        <option value="hr">HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Order</label>
                      <input
                        type="number"
                        value={round.order}
                        onChange={(e) => handleRoundChange(roundIndex, 'order', parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {round.type === 'aptitude' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium">Aptitude Questions</h4>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(roundIndex)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <FaPlus /> Add Question
                        </button>
                      </div>

                      {round.aptitudeQuestions?.map((question, qIndex) => (
                        <div key={qIndex} className="border rounded p-4 mb-4">
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Question</label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(roundIndex, qIndex, 'question', e.target.value)}
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>

                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="mb-2">
                              <label className="block text-sm font-medium mb-2">Option {oIndex + 1}</label>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleQuestionChange(roundIndex, qIndex, 'option', [e.target.value, oIndex])}
                                className="w-full p-2 border rounded"
                                required
                              />
                            </div>
                          ))}

                          <div>
                            <label className="block text-sm font-medium mb-2">Correct Option</label>
                            <select
                              value={question.correctOption}
                              onChange={(e) => handleQuestionChange(roundIndex, qIndex, 'correctOption', parseInt(e.target.value))}
                              className="w-full p-2 border rounded"
                              required
                            >
                              {question.options.map((_, index) => (
                                <option key={index} value={index}>Option {index + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowTemplateForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save Template
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.isArray(interviewTemplates) && interviewTemplates.length > 0 ? (
          interviewTemplates.map((template) => (
            <motion.div
              key={template?._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{template?.name || 'Untitled Template'}</h3>
                  <p className="text-gray-600">{template?.description || 'No description available'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTemplate(template?._id)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template?._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Rounds:</h4>
                <div className="space-y-2">
                  {Array.isArray(template?.rounds) && template.rounds.map((round, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {index + 1}. {round?.name || 'Unnamed Round'} ({round?.type || 'unknown'})
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No interview templates found. Create one to get started!</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {formData.rounds.map((round, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{round.name || `Round ${index + 1}`}</div>
                  <div className="text-sm text-gray-600 capitalize">{round.type}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newRounds = formData.rounds.filter((_, i) => i !== index);
                  setFormData(prev => ({ ...prev, rounds: newRounds }));
                }}
                className="text-red-500 hover:text-red-600"
              >
                <FaTrash />
              </button>
            </div>
            {round.type === 'aptitude' && (
              <div className="mt-4 space-y-4">
                {(round.aptitudeQuestions || []).map((question, qIndex) => (
                  <div key={qIndex} className="pl-8 border-l-2 border-blue-100">
                    <div className="font-medium mb-2">Question {qIndex + 1}</div>
                    <div className="text-sm text-gray-600">{question.question}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewManagement;
