import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category, Section, SectionColor } from '../types';
import { Trash2, Plus, FolderPlus, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COLOR_OPTIONS, getSectionColorStyle } from './DetailPanel';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  sections: Section[];
  onAddSection: (name: string, color?: string) => void;
  onUpdateSection: (id: string, name: string, color?: string) => void;
  onDeleteSection: (id: string) => void;
  onOpenTutorial?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  categories,
  setCategories,
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onOpenTutorial,
}: SettingsModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatSectionId, setNewCatSectionId] = useState<string>(sections[0]?.id || 'study');

  // New section state
  const [newSecName, setNewSecName] = useState('');
  const [newSecColor, setNewSecColor] = useState<SectionColor>('indigo');

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const targetSectionId = newCatSectionId || sections[0]?.id || 'study';
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCatName.trim(),
      type: targetSectionId,
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleCreateSection = () => {
    if (!newSecName.trim()) return;
    onAddSection(newSecName.trim(), newSecColor);
    setNewSecName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <DialogTitle>Manage Sections & Categories</DialogTitle>
          {onOpenTutorial && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              onClick={() => {
                onClose();
                onOpenTutorial();
              }}
            >
              Replay Guide 💡
            </Button>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto py-2 pr-2">
          <div className="space-y-6">
            
            {/* Create New Section Card */}
            <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-indigo-600" /> Create New Section
              </h4>
              <div className="space-y-2">
                <Input
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  placeholder="e.g. Reading / Exam study / Hobbies..."
                  className="h-8 text-xs bg-background"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewSecColor(c.id)}
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer",
                          c.bar,
                          newSecColor === c.id ? "ring-2 ring-offset-1 ring-primary scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        title={c.id}
                      >
                        {newSecColor === c.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreateSection}
                    disabled={!newSecName.trim()}
                    className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Add Section
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Sections & Categories List */}
            {sections.map((sec) => {
              const style = getSectionColorStyle(sec.color);
              const secCats = categories.filter(c => c.type === sec.id);

              return (
                <div key={sec.id} className="p-3 bg-card border rounded-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-4 rounded-full", style.bar)} />
                      <Input
                        value={sec.name}
                        onChange={(e) => onUpdateSection(sec.id, e.target.value, sec.color)}
                        className="h-7 text-xs font-bold w-36 border-transparent hover:border-input focus:border-input bg-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Color dots */}
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onUpdateSection(sec.id, sec.name, c.id)}
                          className={cn(
                            "w-4 h-4 rounded-full transition-all cursor-pointer",
                            c.bar,
                            sec.color === c.id ? "ring-2 ring-offset-1 ring-primary scale-110" : "opacity-40 hover:opacity-80"
                          )}
                        />
                      ))}
                      {sections.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete section "${sec.name}"?`)) {
                              onDeleteSection(sec.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Categories under this section */}
                  <div className="space-y-1.5 pl-2">
                    {secCats.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between bg-muted/40 px-2.5 py-1.5 rounded-md text-xs">
                        <span>{cat.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCategory(cat.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {secCats.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic py-1">No categories</p>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </ScrollArea>

        {/* Category Add Form */}
        <div className="border-t pt-3 space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add New Category</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="e.g. Cardio / World History..."
              className="h-8 text-xs flex-1"
            />
            <select
              className="flex h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs"
              value={newCatSectionId}
              onChange={(e) => setNewCatSectionId(e.target.value)}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleAddCategory} disabled={!newCatName.trim()} className="h-8 text-xs shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
