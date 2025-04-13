-- Trigger to automatically set personalization status to 'pending' when a new course enrollment is created

-- First create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION set_personalization_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set status to pending for new enrollments that don't already have a status
  IF NEW.personalized_content_generation_status IS NULL THEN
    NEW.personalized_content_generation_status = 'pending';
    NEW.personalized_content_started_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert on hr_course_enrollments
DROP TRIGGER IF EXISTS trigger_set_personalization_pending ON hr_course_enrollments;

CREATE TRIGGER trigger_set_personalization_pending
BEFORE INSERT ON hr_course_enrollments
FOR EACH ROW
EXECUTE FUNCTION set_personalization_pending();

-- Also create a trigger for updates to catch enrollments that are updated
DROP TRIGGER IF EXISTS trigger_set_personalization_pending_on_update ON hr_course_enrollments;

CREATE TRIGGER trigger_set_personalization_pending_on_update
BEFORE UPDATE ON hr_course_enrollments
FOR EACH ROW
WHEN (
  -- Only trigger when status is null and course_id is being modified
  OLD.personalized_content_generation_status IS NULL AND
  (OLD.course_id != NEW.course_id OR OLD.course_id IS NULL)
)
EXECUTE FUNCTION set_personalization_pending(); 