use std::marker::PhantomData;

use crate::entity::common::enums::StudentStatus;
use crate::entity::g1::children;

// ─── State markers ───

#[derive(Debug)]
pub struct Active;
#[derive(Debug)]
pub struct Unlinked;
#[derive(Debug)]
pub struct Linked;

// ─── Type-state wrapper ───

#[derive(Debug)]
pub struct Child<S> {
    pub model: children::Model,
    pub _state: PhantomData<S>,
}

// ─── Common methods (all states) ───

impl<S> Child<S> {
    pub fn inner(&self) -> &children::Model {
        &self.model
    }

    pub fn into_inner(self) -> children::Model {
        self.model
    }
}

// ─── From Model (defaults to Active) ───

impl From<children::Model> for Child<Active> {
    fn from(model: children::Model) -> Self {
        Self {
            model,
            _state: PhantomData,
        }
    }
}

// ─── Active state ───

impl Child<Active> {
    pub fn new(model: children::Model) -> Self {
        Self {
            model,
            _state: PhantomData,
        }
    }

    /// Link this child to a student record.
    pub fn link(self, student_id: uuid::Uuid) -> Child<Linked> {
        let mut model = self.model;
        model.student_id = Some(student_id);
        Child {
            model,
            _state: PhantomData,
        }
    }

    /// Unlink this child from their student record.
    pub fn unlink(self) -> Child<Unlinked> {
        let mut model = self.model;
        model.student_id = None;
        Child {
            model,
            _state: PhantomData,
        }
    }

    /// Check if this child is linked to a student.
    pub fn is_linked(&self) -> bool {
        self.model.student_id.is_some()
    }

    /// Get the student_id if linked.
    pub fn student_id(&self) -> Option<uuid::Uuid> {
        self.model.student_id
    }

    /// Get the child's current status.
    pub fn status(&self) -> StudentStatus {
        self.model.status
    }

    /// Check if the child is active.
    pub fn is_active(&self) -> bool {
        self.model.status == StudentStatus::Active
    }

    /// Check if the child has a birth certificate number.
    pub fn has_birth_certificate(&self) -> bool {
        self.model
            .birth_certificate_number
            .as_ref()
            .is_some_and(|s| !s.is_empty())
    }

    /// Check if the child has an NIC.
    pub fn has_nic(&self) -> bool {
        self.model.nic.as_ref().is_some_and(|s| !s.is_empty())
    }

    /// Check if the child has a passport.
    pub fn has_passport(&self) -> bool {
        self.model
            .passport_number
            .as_ref()
            .is_some_and(|s| !s.is_empty())
    }

    /// Check if the child has any identification document.
    pub fn has_any_identification(&self) -> bool {
        self.has_birth_certificate() || self.has_nic() || self.has_passport()
    }

    /// Graduate the child.
    pub fn graduate(self) -> Child<Active> {
        let mut model = self.model;
        model.status = StudentStatus::Graduated;
        Child {
            model,
            _state: PhantomData,
        }
    }

    /// Remove the child.
    pub fn remove(self) -> Child<Active> {
        let mut model = self.model;
        model.status = StudentStatus::Removed;
        Child {
            model,
            _state: PhantomData,
        }
    }
}

// ─── Linked state ───

impl Child<Linked> {
    /// Get the linked student_id.
    pub fn student_id(&self) -> uuid::Uuid {
        self.model.student_id.unwrap()
    }

    /// Unlink from student.
    pub fn unlink(self) -> Child<Unlinked> {
        let mut model = self.model;
        model.student_id = None;
        Child {
            model,
            _state: PhantomData,
        }
    }
}

// ─── Unlinked state ───

impl Child<Unlinked> {
    /// Link to a student.
    pub fn link(self, student_id: uuid::Uuid) -> Child<Linked> {
        let mut model = self.model;
        model.student_id = Some(student_id);
        Child {
            model,
            _state: PhantomData,
        }
    }
}
