FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY src/check_in_habit/requirements.txt .
RUN pip install -r requirements.txt

# Copy common modules
COPY src/habits_common ${LAMBDA_TASK_ROOT}/habits_common

# Copy function code
COPY src/check_in_habit/handler.py ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD ["handler.handler"]
